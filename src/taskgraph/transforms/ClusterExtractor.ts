import { RegularTask } from "../tasks/RegularTask.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { Body, Call, FileJp, FunctionJp, Statement, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { ConcreteTask } from "../tasks/ConcreteTask.js";
import cluster from "cluster";

export class ClusterExtractor {
    constructor() { }

    public extractCluster(tasks: ConcreteTask[], filename?: string): boolean {
        // 0. validate cluster
        // 1. wrap in a function
        // 2. call extractClusterFromTask
        return true;
    }

    public extractClusterFromTask(task: RegularTask, fileName?: string, clusterPrefix: string = "cluster0"): boolean {
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
                return false;
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

        this.moveToNewFile(funs, fileJp, clusterPrefix);

        this.addClusterSwitch(call, clusterPrefix);

        this.createExternGlobalRefs(fileJp);

        return true;
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

    private moveToNewFile(funs: FunctionJp[], fileJp: FileJp, clusterPrefix: string): void {
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
    }

    private addClusterSwitch(call: Call, clusterPrefix: string): void {
        const guard = ClavaJoinPoints.stmtLiteral("bool offload = true;");
        const condExpr = ClavaJoinPoints.varRef("offload", ClavaJoinPoints.type("bool"));

        const hwCall = ClavaJoinPoints.callFromName(`wrapped_${clusterPrefix}`, call.function.returnType, ...call.args);
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