import { RegularTask } from "../tasks/RegularTask.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { Body, Call, FileJp, FunctionJp, Statement, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { ConcreteTask } from "../tasks/ConcreteTask.js";
export class ClusterExtractor {
    constructor() { }

    public extractCluster(tasks: ConcreteTask[], filename?: string, clusterPrefix: string = "cluster0"): FunctionJp | null {
        // 0. validate cluster
        if (!this.validateCluster(tasks)) {
            console.log("[ClusterExtractor] Error: Cluster validation failed, aborting...");
            return null;
        }
        const wrapperTask = this.wrapCluster(tasks);
        return this.extractClusterFromTask(wrapperTask, filename, clusterPrefix);
    }

    public extractClusterFromTask(task: RegularTask, fileName?: string, clusterPrefix: string = "cluster0"): FunctionJp | null {
        const fun = task.getFunction();
        const originalFile = fun.getAncestor("file") as FileJp;

        if (fileName == undefined) {
            fileName = `${fun.name}.${ClavaUtils.getCurrentFileExt()}`
        }
        else {
            if (!fileName.includes(".")) {
                fileName = `${fileName}.${ClavaUtils.getCurrentFileExt()}`
            }
            else if (!fileName.endsWith(`.${ClavaUtils.getCurrentFileExt()}`)) {
                const ext = fileName.split(".").pop();
                console.log(`[ClusterExtractor] Error: File extension ${ext} does not match the current file extension, aborting...`);
                return null;
            }
        }

        const decl = fun.getDeclaration(true);
        const declStmt = ClavaJoinPoints.stmtLiteral(`extern ${decl};`);
        const call = task.getCall()!;
        const callFun = call.function;
        callFun.insertBefore(declStmt);

        const subDir = originalFile.sourceFoldername;
        const fileJp = ClavaJoinPoints.file(fileName, subDir);
        Clava.addFile(fileJp);

        const funs = this.getAllFunctionsInCluster(task);

        const entrypoint = this.moveToNewFile(funs, fileJp, clusterPrefix);

        this.addClusterSwitch(call, clusterPrefix);

        const wrapper = this.createWrappedFunction(call, entrypoint, clusterPrefix);

        this.createExternGlobalRefs(fileJp);

        return wrapper;
    }

    private validateCluster(cluster: ConcreteTask[]): boolean {
        return true;
    }

    private wrapCluster(tasks: ConcreteTask[]): RegularTask {
        return tasks[0] as RegularTask;
    }

    private getAllFunctionsInCluster(task: RegularTask): FunctionJp[] {
        const funs: FunctionJp[] = [task.getFunction()];

        for (const child of task.getHierarchicalChildren()) {
            if (child instanceof RegularTask) {
                funs.push(...this.getAllFunctionsInCluster(child));
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

    private addClusterSwitch(call: Call, clusterPrefix: string): void {
        const guard = ClavaJoinPoints.stmtLiteral("bool offload = true;");
        const condExpr = ClavaJoinPoints.varRef("offload", ClavaJoinPoints.type("bool"));

        const wrappedName = `wrapped_${clusterPrefix}`;
        const hwCall = ClavaJoinPoints.callFromName(wrappedName, call.function.returnType, ...call.args);
        const hwCallExpr = ClavaJoinPoints.exprStmt(hwCall);
        const hwCallScope = ClavaJoinPoints.scope(hwCallExpr);
        hwCallScope.naked = false;

        const swCall = ClavaJoinPoints.callFromName(`${call.function.name}`, call.function.returnType, ...call.args);
        const swCallExpr = ClavaJoinPoints.exprStmt(swCall);
        const swCallScope = ClavaJoinPoints.scope(swCallExpr);
        swCallScope.naked = false;

        const ifStmt = ClavaJoinPoints.ifStmt(condExpr, hwCallScope, swCallScope);
        call.insertBefore(ifStmt);
        ifStmt.insertBefore(guard);
    }

    private createWrappedFunction(call: Call, entrypoint: FunctionJp, clusterPrefix: string): FunctionJp {
        const callFun = call.function;
        const wrapperFun = ClavaJoinPoints.functionDecl(`wrapped_${clusterPrefix}`, call.function.returnType, ...call.function.params);
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
}