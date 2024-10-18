import Timer from "@specs-feup/clava/api/lara/code/Timer.js";
import { AStage } from "../../AStage.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { FileJp, Scope, Statement } from "@specs-feup/clava/api/Joinpoints.js";
import { TimerUnit } from "@specs-feup/lara/api/lara/util/TimeUnits.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export class FunctionInstrumenter extends AStage {
    private prefix: string;
    private timingsCsv: string;

    constructor(topFunction: string, prefix: string = "INSTR", timingsCsv: string = "task_timings.csv") {
        super("TransFlow-Profiler-FunctionInst", topFunction);
        this.prefix = prefix;
        this.timingsCsv = timingsCsv;
    }

    public instrument(): number {
        const flags = this.instrumentAllFunctions();
        this.generateFlagFile(flags);

        return flags.length;
    }

    public instrumentAllFunctions(): string[] {
        const flags: Set<string> = new Set();
        const validFuns = ClavaUtils.getAllUniqueFunctions(this.getTopFunctionJoinPoint());

        for (const fun of validFuns) {
            const body = fun.body;
            if (body != undefined && body.children.length > 0) {
                const flag = this.instrumentScope(body, fun.name);
                flags.add(flag);
            }
        }
        return Array.from(flags);
    }

    private instrumentScope(scope: Scope, funName: string) {
        const firstStmt = scope.children[0];
        const lastStmt = scope.children[scope.children.length - 1];

        const timer = new Timer(TimerUnit.MICROSECONDS, this.timingsCsv);
        timer.time(firstStmt, `${funName},`, lastStmt);

        const flag = `${this.prefix}_${funName.toUpperCase()}`;
        const startGuard1 = ClavaJoinPoints.stmtLiteral(`#ifdef ${flag}`);
        scope.children[0].insertBefore(startGuard1);

        const startGuard2 = ClavaJoinPoints.stmtLiteral(`#endif // ${flag}`);
        firstStmt.insertBefore(startGuard2);

        const endGuard1 = ClavaJoinPoints.stmtLiteral(`#ifdef ${flag}`);
        lastStmt.insertAfter(endGuard1);

        const endGuard2 = ClavaJoinPoints.stmtLiteral(`#endif // ${flag}`);
        scope.children[scope.children.length - 1].insertAfter(endGuard2);

        return flag;
    }

    private generateFlagFile(flags: string[]): void {
        const stmts: Statement[] = [];

        stmts.push(ClavaJoinPoints.stmtLiteral("#pragma once"));
        for (const flag of flags) {
            stmts.push(ClavaJoinPoints.stmtLiteral(`#define ${flag}`));
        }

        const fileJp = ClavaJoinPoints.file("func_instrumentation.h");
        for (const stmt of stmts.reverse()) {
            fileJp.insertBegin(stmt);
        }
        Clava.addFile(fileJp);

        for (const otherFile of Query.search(FileJp)) {
            if (otherFile.name == "func_instrumentation.h") {
                continue;
            }
            otherFile.addIncludeJp(fileJp);
        }
    }
}