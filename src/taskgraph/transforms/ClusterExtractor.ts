import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { ConstantDataItem } from "../dataitems/ConstantDataItem.js";
import { VariableDataItem } from "../dataitems/VariableDataItem.js";
import { Cluster } from "../Cluster.js";
import { Body, Call, FileJp, FunctionJp, Param, Statement, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import { RegularTask } from "../tasks/RegularTask.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";

export class ClusterExtractor {
    public extractCluster(cluster: Cluster, clusterName: string = "cluster0", clusterFileName?: string): FunctionJp | null {
        const ext = ClavaUtils.getCurrentFileExt();

        if (clusterFileName == undefined) {
            clusterFileName = `${clusterName}.${ext}`;
        }
        const bridgeFileName = clusterFileName.replace(`.${ext}`, `_bridge.${ext}`);

        const firstCall = cluster.getCalls()[0];
        const parentFun = firstCall.getAncestor("function") as FunctionJp;
        const originalFile = firstCall.getAncestor("file") as FileJp;
        const subDir = originalFile.sourceFoldername;

        const clusterFileJp = this.createFile(clusterFileName, subDir);
        const bridgeFileJp = this.createFile(bridgeFileName, subDir);

        // Create HW cluster in its own file
        const entrypointHw = this.createEntryPoint(cluster, clusterName);
        this.populateEntrypoint(cluster, entrypointHw, true);
        clusterFileJp.insertBegin(entrypointHw);

        const funs: FunctionJp[] = [];
        for (const task of cluster.getTasks()) {
            this.getAllFunctionsInTask(task as RegularTask).forEach(fun => funs.push(fun));
        }
        this.moveToNewFile(funs, clusterFileJp, clusterName);

        this.copyIncludes(clusterFileJp, originalFile);
        this.createExternGlobalRefs(clusterFileJp);

        // Create bridge function in the bridge file
        const bridge = this.createBridgeFunction(entrypointHw, clusterName);
        bridgeFileJp.insertBegin(bridge);

        this.copyIncludes(bridgeFileJp, originalFile);
        this.createExternGlobalRefs(bridgeFileJp);

        // Create SW cluster in the original file
        const entrypointSw = this.createEntryPoint(cluster, `${clusterName}_sw`);
        this.populateEntrypoint(cluster, entrypointSw, false);
        parentFun.insertBefore(entrypointSw);

        // Create toggleable calls between HW and SW
        const swCall = this.createCall(entrypointSw);
        const hwBridgeCall = this.createCall(bridge);

        const newStmts: Statement[] = [
            ClavaJoinPoints.stmtLiteral("#ifndef OFFLOAD"),
            ClavaJoinPoints.exprStmt(swCall),
            ClavaJoinPoints.stmtLiteral("#else"),
            ClavaJoinPoints.exprStmt(hwBridgeCall),
            ClavaJoinPoints.stmtLiteral("#endif")
        ];
        newStmts.forEach(stmt => firstCall.insertBefore(stmt));

        // Detach original calls to cluster functions
        for (const call of cluster.getCalls()) {
            call.parent.detach();
        }

        // Declare HW function in bridge
        const hwDecl = entrypointHw.getDeclaration(true);
        const hwDeclStmt = ClavaJoinPoints.stmtLiteral(`${hwDecl};`);
        bridge.insertBefore(hwDeclStmt);

        // Declare bridge function in original file
        const bridgeDecl = bridge.getDeclaration(true);
        const optionalDecl: Statement[] = [
            ClavaJoinPoints.stmtLiteral("#ifdef OFFLOAD"),
            ClavaJoinPoints.stmtLiteral(`${bridgeDecl};`),
            ClavaJoinPoints.stmtLiteral("#endif")
        ];
        optionalDecl.forEach(stmt => parentFun.insertBefore(stmt));

        return bridge;
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

    private createEntryPoint(cluster: Cluster, name: string): FunctionJp {
        const params: Param[] = [];

        for (const paramName in cluster.getInterfaceDataItems()) {
            const dataItems = cluster.getInterfaceDataItems()[paramName];
            const aDataItem = dataItems[0];
            if (paramName === "<n/a>") {
                continue;
            }

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

    private getAllFunctionsInTask(task: RegularTask): FunctionJp[] {
        const funs: FunctionJp[] = [task.getFunction()];

        for (const child of task.getHierarchicalChildren()) {
            if (child instanceof RegularTask) {
                funs.push(...this.getAllFunctionsInTask(child));
            }
        }
        return funs;
    }

    private createCall(entrypoint: FunctionJp): Call {
        const args = entrypoint.params.map(param => ClavaJoinPoints.varRef(param.name, param.type));
        const call = ClavaJoinPoints.call(entrypoint, ...args);
        return call;
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

    private createBridgeFunction(hwEntrypoint: FunctionJp, clusterPrefix: string): FunctionJp {
        const bridgeFun = ClavaJoinPoints.functionDecl(`${clusterPrefix}_hw_bridge`, hwEntrypoint.returnType, ...hwEntrypoint.params);
        const clusterCall = this.createCall(hwEntrypoint);

        const stmts: Statement[] = [
            ClavaJoinPoints.stmtLiteral("// Replace this call with the accelerator boilerplate"),
            ClavaJoinPoints.exprStmt(clusterCall),
            ClavaJoinPoints.stmtLiteral("// End of SW-HW bridge")
        ];
        const body = ClavaJoinPoints.scope(...stmts);
        bridgeFun.setBody(body);

        return bridgeFun;
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