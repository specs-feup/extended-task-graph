import { Call, DeclStmt, ExprStmt, FunctionJp, Scope, Statement, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import { TaskGraph } from "../TaskGraph.js";
import { RegularTask } from "../tasks/RegularTask.js";
import { Outliner } from "@specs-feup/clava-code-transforms/Outliner";
import Inliner from "@specs-feup/clava/api/clava/code/Inliner.js";
import { DefaultPrefix, DefaultSuffix } from "../../api/PreSuffixDefaults.js";
import { VariableDataItem } from "../dataitems/VariableDataItem.js";
import { DataItemOrigin } from "../DataItemOrigin.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export class TaskSplitter {
    private suffix: string;

    constructor(suffix: string = DefaultSuffix.SPLIT_TASK) {
        this.suffix = suffix;
    }

    public splitTask(etg: TaskGraph, task: RegularTask, stmt: Statement): [RegularTask, RegularTask] {
        const hierParent = task.getHierarchicalParent()! as RegularTask;
        const oldCall = task.getCall()!;
        const oldFun = task.getFunction();
        const oldBody = oldFun.body as Scope;

        const regions = this.getRegions(oldBody, stmt);
        const outliner = new Outliner(true);

        const nameA = `${oldFun.name}${this.suffix}_A`;
        outliner.outlineWithName(regions[0], regions[1], nameA, false);

        const nameB = `${oldFun.name}${this.suffix}_B`;
        outliner.outlineWithName(regions[2], regions[3], nameB, false);

        const [callA, callB, outsideDecls] = this.inlineOldCall(oldCall);
        const funA = callA.function;
        const funB = callB.function;

        const declNames = this.addDeclsToParent(outsideDecls, hierParent);

        const taskA = new RegularTask(callA, funA!, hierParent);
        const taskB = new RegularTask(callB, funB!, hierParent);

        this.reassignIncomingEdges(etg, task, taskA, taskB);
        this.reassignOutgoingEdges(task, taskB, taskA);

        this.createInterTaskComm(etg, taskA, taskB, declNames);

        etg.removeTask(task);
        etg.addTask(taskA);
        etg.addTask(taskB);
        hierParent.addHierarchicalChild(taskA);
        hierParent.addHierarchicalChild(taskB);

        this.finalCleanup(task, funA, funB);

        return [taskA, taskB];
    }

    private getRegions(body: Scope, stmt: Statement): [Statement, Statement, Statement, Statement] {
        const res = [
            body.children[0],
            stmt,
            stmt,
            body.children[body.children.length - 1]
        ] as [Statement, Statement, Statement, Statement];

        for (let i = 0; i < body.children.length; i++) {
            if (body.children[i].astId === stmt.astId) {
                res[1] = body.children[i - 1] as Statement;
                break;
            }
        }
        return res;
    }

    private inlineOldCall(oldCall: Call): [Call, Call, DeclStmt[]] {
        const callExpr = oldCall.parent as ExprStmt;
        const scope = callExpr.parent as Scope;

        const inliner = new Inliner({ prefix: DefaultPrefix.INLINE_VAR });
        inliner.inline(oldCall.parent as ExprStmt);

        const decls: DeclStmt[] = [];
        const innerScope = scope.stmts.find(stmt => stmt instanceof Scope) as Scope;

        let foundFirst = false;
        let callA = oldCall;
        let callB = oldCall;

        for (const stmt of innerScope.stmts) {
            innerScope.insertBefore(stmt);

            if (stmt instanceof DeclStmt) {
                decls.push(stmt);
            }
            else if (stmt instanceof ExprStmt && !foundFirst) {
                foundFirst = true;
                callA = stmt.children[0] as Call;
                continue;
            }
            else if (stmt instanceof ExprStmt && foundFirst) {
                callB = stmt.children[0] as Call;
            }
        }
        innerScope.detach();

        return [callA, callB, decls];
    }

    private addDeclsToParent(declStmts: DeclStmt[], parent: RegularTask): string[] {
        const declNames: string[] = [];

        for (const declStmt of declStmts) {
            const vardecl = declStmt.decls[0] as Vardecl;
            const dataItem = new VariableDataItem(vardecl, DataItemOrigin.NEW);
            parent.addNewData(dataItem);
            declNames.push(vardecl.name);
        }
        return declNames;
    }

    private createInterTaskComm(etg: TaskGraph, taskA: RegularTask, taskB: RegularTask, declNames: string[]): void {
        // no need to bother with the args and param having different names,
        // as the inlining already assures us that the names are the same
        const parent = taskA.getHierarchicalParent()!;
        const paramsA = taskA.getFunction().params;
        const argsA = taskA.getCall()!.args;

        const writtenByA: Set<string> = new Set();
        for (let i = 0; i < paramsA.length; i++) {
            const param = paramsA[i];

            const arg = argsA[i].getDescendantsAndSelf("varref").find(jp => jp instanceof Varref) as Varref;
            if (!declNames.includes(arg.name)) {
                continue;
            }

            const dataItemInParent = parent.getDataItemByName(arg.name)!;
            const dataItemInA = taskA.getDataItemByName(param.name)!;

            etg.addCommunication(parent, taskA, dataItemInParent, dataItemInA, i);

            if (dataItemInA.isWritten()) {
                writtenByA.add(param.name);
            }
        }

        const paramsB = taskB.getFunction().params;
        const argsB = taskB.getCall()!.args;

        const writtenByB: Set<string> = new Set();
        for (let i = 0; i < paramsB.length; i++) {
            const param = paramsB[i];

            const arg = argsB[i].getDescendantsAndSelf("varref").find(jp => jp instanceof Varref) as Varref;
            if (!declNames.includes(arg.name)) {
                continue;
            }


            const dataItemInB = taskB.getDataItemByName(param.name)!;

            if (writtenByA.has(param.name)) {
                const dataItemInA = taskA.getDataItemByName(param.name)!;
                etg.addCommunication(taskA, taskB, dataItemInA, dataItemInB, i);
            }
            else {
                const dataItemInParent = parent.getDataItemByName(arg.name)!;
                etg.addCommunication(parent, taskB, dataItemInParent, dataItemInB, i);
            }

            if (dataItemInB.isWritten()) {
                writtenByB.add(param.name);
            }
        }
    }

    private reassignIncomingEdges(etg: TaskGraph, oldTask: RegularTask, firstTask: RegularTask, secondTask: RegularTask) {
        const oldIncoming = oldTask.getIncomingComm();

        for (const comm of oldIncoming) {
            const targetDataName = comm.getTargetData().getName();

            const firstTaskData = firstTask.getDataItemByName(targetDataName);

            // if the data item is not found in the first task, it may be in the second
            if (firstTaskData == null) {
                const secondTaskData = secondTask.getDataItemByName(targetDataName);

                if (secondTaskData !== null) {
                    comm.setTarget(secondTask);
                }
            }
            else {
                comm.setTarget(firstTask);

                // if the first task only reads the item, and the second task also needs it,
                // create a new edge
                if (!firstTaskData.isWritten()) {
                    const secondTaskData = secondTask.getDataItemByName(targetDataName);

                    if (secondTaskData !== null) {
                        const n = secondTask.getData().length;
                        const source = comm.getSource();
                        etg.addCommunication(source, secondTask, firstTaskData, secondTaskData, n);
                    }
                }
            }
        }
        oldTask.removeAllIncomingComm();
    }

    private reassignOutgoingEdges(oldTask: RegularTask, taskB: RegularTask, taskA: RegularTask) {
        const oldOutgoing = oldTask.getOutgoingComm();

        for (const comm of oldOutgoing) {
            const sourceDataName = comm.getSourceData().getName();

            const taskBmodified: Set<string> = new Set();
            for (const dataItem of taskB.getData()) {
                const newTaskDataName = dataItem.getName();

                if (sourceDataName == newTaskDataName && dataItem.isWritten()) {
                    comm.setSource(taskB);
                    taskBmodified.add(newTaskDataName);
                }
            }

            for (const dataItem of taskA.getData()) {
                const newTaskDataName = dataItem.getName();

                if (sourceDataName == newTaskDataName && dataItem.isWritten() && !taskBmodified.has(newTaskDataName)) {
                    comm.setSource(taskA);
                }
            }
            oldTask.removeAllOutgoingComm();
        }
    }

    private finalCleanup(oldTask: RegularTask, funA: FunctionJp, funB: FunctionJp): void {
        const file = oldTask.getFunction().getAncestor("file");
        oldTask.getFunction().detach();

        for (const fun of Query.searchFrom(file, FunctionJp)) {
            const cond1 = fun.name == funA.name || fun.name == funB.name;
            const cond2 = !fun.isImplementation;
            if (cond1 && cond2) {
                fun.detach();
            }
        }
    }
}