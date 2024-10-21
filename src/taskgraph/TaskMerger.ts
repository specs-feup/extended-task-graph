import { Body, Call, ExprStmt, FunctionJp, Scope } from "@specs-feup/clava/api/Joinpoints.js";
import Inliner from "@specs-feup/clava/api/clava/code/Inliner.js";
import { TaskGraph } from "./TaskGraph.js";
import { RegularTask } from "./tasks/RegularTask.js";
import Outliner from "clava-code-transformations/Outliner";
import { Communication } from "./Communication.js";
import { ConcreteTask } from "./tasks/ConcreteTask.js";
import { DefaultPrefix } from "../api/PreSuffixDefaults.js";

export class TaskMerger {
    private inliningPrefix;
    private outliningPrefix;

    constructor(inliningPrefix: string = DefaultPrefix.INLINE_VAR, outliningPrefix: string = DefaultPrefix.MERGED_FUN) {
        this.inliningPrefix = inliningPrefix;
        this.outliningPrefix = outliningPrefix;

    }
    public mergeTasks(taskGraph: TaskGraph, t1: RegularTask, t2: RegularTask): RegularTask | null {
        const valid = this.validToMerge(t1, t2);
        if (!valid) {
            return null;
        }
        const hierParent = t1.getHierarchicalParent()! as ConcreteTask;

        const movedCall = this.ensureSequentialCalls(t1, t2);
        console.log(movedCall ? "Moved calls successfully" : "Calls are already sequential");

        const [newFun, newCall] = this.outlineCalls(t1, t2);
        if (newFun === null || newCall === null) {
            return null;
        }

        this.inlineCalls(newFun);

        const newTask = this.createNewTask(newCall, newFun, t1, t2, taskGraph);

        taskGraph.addTask(newTask);
        hierParent.addHierarchicalChild(newTask);

        taskGraph.removeTask(t1);
        taskGraph.removeTask(t2);

        t1.getFunction().detach();
        t2.getFunction().detach();

        return newTask;
    }

    public validToMerge(t1: RegularTask, t2: RegularTask): boolean {
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

    private ensureSequentialCalls(t1: RegularTask, t2: RegularTask): boolean {
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

    private outlineCalls(t1: RegularTask, t2: RegularTask): [FunctionJp, Call] | [null, null] {
        const outliner = new Outliner();
        outliner.setVerbosity(false);
        outliner.setDefaultPrefix(this.outliningPrefix);

        const callExpr1 = t1.getCall()!.parent as ExprStmt;
        const callExpr2 = t2.getCall()!.parent as ExprStmt;

        return outliner.outline(callExpr1, callExpr2);
    }

    private inlineCalls(fun: FunctionJp): void {
        const inliner = new Inliner({ prefix: this.inliningPrefix });

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

    private createNewTask(call: Call, fun: FunctionJp, t1: RegularTask, t2: RegularTask, etg: TaskGraph): RegularTask {
        const hierParent = t1.getHierarchicalParent()!;

        const newTask = new RegularTask(call, fun, hierParent);
        const oldEdges: Communication[] = [];

        const incoming: Communication[] = [];
        for (const comm of t1.getIncomingComm()) {
            if (comm.getSource().getId() !== t2.getId()) {
                comm.setTarget(newTask);
                incoming.push(comm);
            }
            else {
                oldEdges.push(comm);
            }
        }
        t1.removeAllIncomingComm();

        for (const comm of t2.getIncomingComm()) {
            if (comm.getSource().getId() !== t1.getId()) {
                comm.setTarget(newTask);
                incoming.push(comm);
            }
            else {
                oldEdges.push(comm);
            }
        }
        t2.removeAllIncomingComm();

        const outgoing: Communication[] = [];
        for (const comm of t1.getOutgoingComm()) {
            if (comm.getTarget().getId() !== t2.getId()) {
                comm.setSource(newTask);
                outgoing.push(comm);
            }
            else {
                oldEdges.push(comm);
            }
        }
        t1.removeAllOutgoingComm();

        for (const comm of t2.getOutgoingComm()) {
            if (comm.getTarget().getId() !== t1.getId()) {
                comm.setSource(newTask);
                outgoing.push(comm);
            }
            else {
                oldEdges.push(comm);
            }
        }
        t2.removeAllOutgoingComm();

        newTask.addIncomingComm(...incoming);
        newTask.addOutgoingComm(...outgoing);

        for (const comm of oldEdges) {
            etg.removeCommunication(comm);
        }

        return newTask;
    }
}