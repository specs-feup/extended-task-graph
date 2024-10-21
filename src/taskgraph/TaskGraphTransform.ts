import { Body, Call, ExprStmt, FunctionJp, Joinpoint, Scope } from "@specs-feup/clava/api/Joinpoints.js";
import Inliner from "@specs-feup/clava/api/clava/code/Inliner.js";
import { TaskGraph } from "./TaskGraph.js";
import { RegularTask } from "./tasks/RegularTask.js";
import Outliner from "clava-code-transformations/Outliner";

export function mergeTasks(taskGraph: TaskGraph, t1: RegularTask, t2: RegularTask): RegularTask | null {
    const valid = validToMerge(t1, t2);
    if (!valid) {
        return null;
    }

    const movedCall = ensureSequentialCalls(t1, t2);
    console.log(movedCall ? "Moved calls successfully" : "Calls are already sequential");

    const [newFun, newCall] = outlineCalls(t1, t2);
    if (newFun === null || newCall === null) {
        return null;
    }
    console.log(newCall.name);

    inlineCalls(newFun);
    return null;
}

export function splitTask(taskGraph: TaskGraph, task: RegularTask, splitPoint: Joinpoint): [RegularTask | null, RegularTask | null] {
    // Implementation
    return [task, task];
}

function validToMerge(t1: RegularTask, t2: RegularTask): boolean {
    const cond1 = t1.getHierarchicalParent()?.getId() === t2.getHierarchicalParent()?.getId();

    const call1 = t1.getCall()!;
    const call2 = t2.getCall()!;
    const scope1 = call1.parent.parent as Body;
    const scope2 = call2.parent.parent as Body;

    const cond2 = scope1.astId === scope2.astId;

    console.log("Condition 1: ", cond1);
    console.log("Condition 2: ", cond2);

    return cond1 && cond2;
}

function ensureSequentialCalls(t1: RegularTask, t2: RegularTask): boolean {
    const call1 = t1.getCall()!;
    const call2 = t2.getCall()!;

    const callExpr1 = call1.parent as ExprStmt;
    const callExpr2 = call2.parent as ExprStmt;

    const scope = call1.parent.parent as Body;
    const stmts = scope.stmts;
    let idxExpr1 = -1;
    let idxExpr2 = -1;

    for (let i = 0; i < stmts.length; i++) {
        if (stmts[i].astId === callExpr1.astId) {
            idxExpr1 = i;
        } else if (stmts[i].astId === callExpr2.astId) {
            idxExpr2 = i;
        }

    }
    if (Math.abs(idxExpr1 - idxExpr2) === 1) {
        return false;
    }
    else {
        // do the transformation
        return true;
    }
}

function outlineCalls(t1: RegularTask, t2: RegularTask): [FunctionJp, Call] | [null, null] {
    const outliner = new Outliner();
    outliner.setVerbosity(false);
    outliner.setDefaultPrefix("_merged_");

    const callExpr1 = t1.getCall()!.parent as ExprStmt;
    const callExpr2 = t2.getCall()!.parent as ExprStmt;

    return outliner.outline(callExpr1, callExpr2);
}

function inlineCalls(fun: FunctionJp): void {
    const inliner = new Inliner({ prefix: "_iln" });

    for (const stmt of fun.body.stmts) {
        const exprStmt = stmt as ExprStmt;
        inliner.inline(exprStmt);
    }

    const funBody = fun.body;
    const scope1 = funBody.children[0] as Scope;
    const scope2 = funBody.children[1] as Scope;

    for (const scope of [scope1, scope2]) {
        for (const stmt of scope.stmts) {
            funBody.insertEnd(stmt);
        }
    }
    scope1.detach();
    scope2.detach();
}