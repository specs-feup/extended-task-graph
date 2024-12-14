import { Body, Call, FileJp, FunctionJp, If, Statement, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { RegularTask } from "../tasks/RegularTask.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export abstract class AExtractor {
    constructor() { }

    protected createFile(fileName: string, subDir: string): FileJp {
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

    public getAllFunctionsInTask(task: RegularTask): FunctionJp[] {
        const funs: FunctionJp[] = [task.getFunction()];

        for (const child of task.getHierarchicalChildren()) {
            if (child instanceof RegularTask) {
                funs.push(...this.getAllFunctionsInTask(child));
            }
        }
        return funs;
    }

    protected moveToNewFile(funs: FunctionJp[], fileJp: FileJp, clusterPrefix: string): FunctionJp {
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

    protected addClusterSwitch(call: Call, clusterPrefix: string): If {
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

    protected createWrappedFunction(call: Call, entrypoint: FunctionJp, clusterPrefix: string): FunctionJp {
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

    protected createExternGlobalRefs(fileJp: FileJp): void {
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