import { Call, DeclStmt, ExprStmt, Scope, Statement, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import { TaskGraph } from "../TaskGraph.js";
import { RegularTask } from "../tasks/RegularTask.js";
import Outliner from "clava-code-transformations/Outliner";
import Inliner from "@specs-feup/clava/api/clava/code/Inliner.js";
import { DefaultPrefix, DefaultSuffix } from "../../api/PreSuffixDefaults.js";
import { VariableDataItem } from "../dataitems/VariableDataItem.js";
import { DataItemOrigin } from "../DataItemOrigin.js";

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
        const outliner = new Outliner();
        outliner.setVerbosity(false);

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

        this.rearrangeCommunication(etg, hierParent, task, taskA, taskB, declNames);

        //etg.removeTask(task);
        etg.addTask(taskA);
        etg.addTask(taskB);
        hierParent.addHierarchicalChild(taskA);
        hierParent.addHierarchicalChild(taskB);

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

    private rearrangeCommunication(etg: TaskGraph, parent: RegularTask, task: RegularTask, taskA: RegularTask, taskB: RegularTask, declNames: string[]): void {
        // no need to bother with the args and param having different names,
        // as the inlining already assures us that the names are the same
        const paramsA = taskA.getFunction().params;
        const argsA = taskA.getCall()!.args;

        for (let i = 0; i < paramsA.length; i++) {
            const param = paramsA[i];
            const arg = argsA[i].getDescendantsAndSelf("varref").find(jp => jp instanceof Varref) as Varref;
            console.log(arg.name);
            console.log(param.name);

            const parentDataItem = parent.getDataItemByName(arg.name)!;
            const dataItemInA = new VariableDataItem(param, DataItemOrigin.PARAM);
            dataItemInA.setAlternateName(arg.name);

            etg.addCommunication(parent, taskA, parentDataItem, dataItemInA, i);
        }

        const usedByA: Set<string> = new Set();

    }
}