import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { ConstantDataItem } from "../dataitems/ConstantDataItem.js";
import { VariableDataItem } from "../dataitems/VariableDataItem.js";
import { Cluster } from "../Cluster.js";
import { Body, Call, FileJp, FunctionJp, If, Param, Statement, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import { RegularTask } from "../tasks/RegularTask.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";

export class ClusterExtractor {
    public extractCluster(cluster: Cluster, clusterName: string = "cluster0", fileName?: string, explicitSwCluster: boolean = false): FunctionJp | null {
        if (fileName == undefined) {
            fileName = `${clusterName}.${ClavaUtils.getCurrentFileExt()}`;
        }
        const firstCall = cluster.getCalls()[0];
        const parenFun = firstCall.getAncestor("function") as FunctionJp;
        const originalFile = firstCall.getAncestor("file") as FileJp;
        const subDir = originalFile.sourceFoldername;

        const fileJp = this.createFile(fileName, subDir);

        const entrypointHw = this.createEntryPoint(cluster, clusterName);
        this.populateEntrypoint(cluster, entrypointHw, true);
        fileJp.insertBegin(entrypointHw);

        const entrypointSw = this.createEntryPoint(cluster, clusterName);
        this.populateEntrypoint(cluster, entrypointSw, false);
        parenFun.insertBefore(entrypointSw);

        const funs: FunctionJp[] = [];
        for (const task of cluster.getTasks()) {
            this.getAllFunctionsInTask(task as RegularTask).forEach(fun => funs.push(fun));
        }
        this.moveToNewFile(funs, fileJp, clusterName);

        const tempSwCall = this.createSwCall(entrypointSw);
        const tempSwCallStmt = ClavaJoinPoints.exprStmt(tempSwCall);
        firstCall.insertBefore(tempSwCallStmt);

        for (const call of cluster.getCalls()) {
            call.parent.detach();
        }
        const ifStmt = this.addClusterSwitch(tempSwCall, clusterName);

        const wrapper = this.createWrappedFunction(tempSwCall, entrypointHw, clusterName);
        tempSwCall.parent.detach();

        if (!explicitSwCluster) {
            const stmts = entrypointSw.body.children;
            const scope = ClavaJoinPoints.scope(...stmts);
            ifStmt.setElse(scope);
        }

        this.createExternGlobalRefs(fileJp);

        this.copyIncludes(fileJp, originalFile);

        return wrapper;
    }

    private createEntryPoint(cluster: Cluster, name: string): FunctionJp {
        const params: Param[] = [];

        for (const paramName in cluster.getInterfaceDataItems()) {
            const dataItems = cluster.getInterfaceDataItems()[paramName];
            const aDataItem = dataItems[0];

            if (aDataItem instanceof VariableDataItem) {
                const decl = aDataItem.getDecl();
                const type = decl.type;
                const newParam = ClavaJoinPoints.param(paramName, type);
                params.push(newParam);
            }
            if (aDataItem instanceof ConstantDataItem) {
                const type = ClavaJoinPoints.type(aDataItem.getDatatype());
                const newParam = ClavaJoinPoints.param(paramName, type);
                params.push(newParam);
            }
        }
        const voidType = ClavaJoinPoints.type("void");
        const entrypoint = ClavaJoinPoints.functionDecl(name, voidType, ...params);
        return entrypoint;
    }

    private populateEntrypoint(cluster: Cluster, entrypoint: FunctionJp, addPrefix: boolean): void {
        const stmts: Statement[] = [];

        for (const call of cluster.getCalls()) {
            const callCopy = call.copy() as Call;
            if (addPrefix) {
                callCopy.setName(`${entrypoint.name}_${call.name}`);
            }
            else {
                callCopy.setName(call.name);
            }

            const expr = ClavaJoinPoints.exprStmt(callCopy);
            stmts.push(expr);
        }
        const body = ClavaJoinPoints.scope(...stmts);
        entrypoint.setBody(body);
    }

    private createSwCall(entrypoint: FunctionJp): Call {
        const varrefs: Varref[] = [];

        for (const param of entrypoint.params) {
            const varref = ClavaJoinPoints.varRef(param.name, param.type);
            varrefs.push(varref);
        }
        const swCall = ClavaJoinPoints.call(entrypoint, ...varrefs);;
        return swCall;
    }

    private createFile(fileName: string, subDir: string): FileJp {
        if (!fileName.includes(".")) {
            fileName = `${fileName}.${ClavaUtils.getCurrentFileExt()}`
        }
        else if (!fileName.endsWith(`.${ClavaUtils.getCurrentFileExt()}`)) {
            const ext = fileName.split(".").pop();
            console.log(`[ClusterExtractor] Warning: File extension ${ext} does not match the current file extension, overriding...`);
            fileName = `${fileName}.${ClavaUtils.getCurrentFileExt()}`;
        }
        const fileJp = ClavaJoinPoints.file(fileName, subDir);
        Clava.addFile(fileJp);

        return fileJp;
    }

    private getAllFunctionsInTask(task: RegularTask): FunctionJp[] {
        const funs: FunctionJp[] = [task.getFunction()];

        for (const child of task.getHierarchicalChildren()) {
            if (child instanceof RegularTask) {
                funs.push(...this.getAllFunctionsInTask(child));
            }
        }
        return funs;
    }

    private moveToNewFile(funs: FunctionJp[], fileJp: FileJp, clusterPrefix: string): FunctionJp {
        const clusterFuns: FunctionJp[] = [];
        const funNames: string[] = [];
        const clusterFunDecls: Statement[] = [];

        for (const fun of funs) {
            const clusterFun = ClavaJoinPoints.functionDecl(`${clusterPrefix}_${fun.name}`, fun.returnType, ...fun.params);
            clusterFun.body = fun.body.copy() as Body;

            clusterFuns.push(clusterFun);
            funNames.push(fun.name);

            const decl = clusterFun.getDeclaration(true);
            const declStmt = ClavaJoinPoints.stmtLiteral(`${decl}; `);
            clusterFunDecls.push(declStmt);

            fileJp.insertEnd(clusterFun);
            fileJp.insertBegin(declStmt);
        }

        for (const fun of clusterFuns) {
            for (const call of Query.searchFrom(fun.body, Call)) {
                if (funNames.includes(call.function.name)) {
                    const newCall = ClavaJoinPoints.callFromName(`${clusterPrefix}_${call.name}`, fun.returnType, ...call.args);
                    call.replaceWith(newCall);
                }
            }
        }
        return clusterFuns[0];
    }

    private addClusterSwitch(call: Call, clusterPrefix: string): If {
        const guard = ClavaJoinPoints.stmtLiteral("bool offload = true;");
        const condExpr = ClavaJoinPoints.varRef("offload", ClavaJoinPoints.type("bool"));

        const hwName = `hw_${clusterPrefix}`;
        const hwCall = ClavaJoinPoints.callFromName(hwName, call.function.returnType, ...call.args);
        const hwCallExpr = ClavaJoinPoints.exprStmt(hwCall);
        const hwCallScope = ClavaJoinPoints.scope(hwCallExpr);
        hwCallScope.naked = false;

        const swName = `sw_${clusterPrefix}`;
        const swCall = ClavaJoinPoints.callFromName(swName, call.function.returnType, ...call.args);
        const swCallExpr = ClavaJoinPoints.exprStmt(swCall);
        const swCallScope = ClavaJoinPoints.scope(swCallExpr);
        swCallScope.naked = false;

        for (const cl of Query.search(Call, { name: call.name })) {
            cl.setName(swName);
        }
        call.function.setName(swName);

        const ifStmt = ClavaJoinPoints.ifStmt(condExpr, hwCallScope, swCallScope);
        call.insertBefore(ifStmt);
        ifStmt.insertBefore(guard);

        return ifStmt;
    }

    private createWrappedFunction(call: Call, entrypoint: FunctionJp, clusterPrefix: string): FunctionJp {
        const callFun = call.function;
        const wrapperFun = ClavaJoinPoints.functionDecl(`hw_${clusterPrefix}`, call.function.returnType, ...call.function.params);
        const entrypointCall = ClavaJoinPoints.call(entrypoint, ...call.args);

        const stmts: Statement[] = [
            ClavaJoinPoints.stmtLiteral("// Replace this call with the accelerator boilerplate"),
            ClavaJoinPoints.exprStmt(entrypointCall),
            ClavaJoinPoints.stmtLiteral("// Wrapper end")
        ];
        const body = ClavaJoinPoints.scope(...stmts);
        wrapperFun.setBody(body);
        callFun.insertBefore(wrapperFun);

        const decl = entrypoint.getDeclaration(true);
        const externDecl = ClavaJoinPoints.stmtLiteral(`extern ${decl};`);
        wrapperFun.insertBefore(externDecl);
        return wrapperFun;
    }

    private createExternGlobalRefs(fileJp: FileJp): void {
        const externVars: Set<string> = new Set();

        for (const vardecl of Query.searchFrom(Clava.getProgram(), Vardecl)) {
            if (vardecl.isGlobal) {
                const code = vardecl.code.split("=")[0].trim();
                const externVar = `extern ${code}; `;

                if (!externVars.has(externVar)) {
                    fileJp.insertBegin(ClavaJoinPoints.stmtLiteral(externVar));
                    externVars.add(externVar);
                }
            }
        }
    }

    private copyIncludes(target: FileJp, source: FileJp): void {
        for (const include of source.includes) {
            const name = include.name;
            const isAngled = include.isAngled;
            target.addInclude(name, isAngled);
        }
    }
}