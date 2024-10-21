import { Call, ExprStmt, Scope, Statement } from "@specs-feup/clava/api/Joinpoints.js";
import { TaskGraph } from "./TaskGraph.js";
import { RegularTask } from "./tasks/RegularTask.js";
import Outliner from "clava-code-transformations/Outliner";
import Inliner from "@specs-feup/clava/api/clava/code/Inliner.js";

export class TaskSplitter {
    private suffix: string;

    constructor(suffix: string = "_shard") {
        this.suffix = suffix;
    }

    public splitTask(etg: TaskGraph, task: RegularTask, stmt: Statement): [RegularTask, RegularTask] {
        const oldCall = task.getCall()!;
        const oldFun = task.getFunction();
        const oldBody = oldFun.body as Scope;

        const regions = this.getRegions(oldBody, stmt);
        const outliner = new Outliner();

        const nameA = `${oldFun.name}${this.suffix}_A`;
        const [funA, callA] = outliner.outlineWithName(regions[0], regions[1], nameA);

        const nameB = `${oldFun.name}${this.suffix}_B`;
        const [funB, callB] = outliner.outlineWithName(regions[2], regions[3], nameB);

        this.inlineOldCall(oldCall);

        return [task, task];
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

    private inlineOldCall(oldCall: Call): void {
        const callExpr = oldCall.parent as ExprStmt;
        const scope = callExpr.parent as Scope;

        const inliner = new Inliner({ prefix: "_shard_" });
        inliner.inline(oldCall.parent as ExprStmt);

        const innerScope = scope.stmts.find(stmt => stmt instanceof Scope) as Scope;
        for (const stmt of innerScope.stmts) {
            innerScope.insertBefore(stmt);
        }
        innerScope.detach();
    }
}