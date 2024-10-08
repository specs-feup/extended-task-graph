import { FunctionJp, Loop, Scope } from "@specs-feup/clava/api/Joinpoints.js";
import { AStage } from "../AStage.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import LoopCharacterizer, { LoopCharacterization } from "clava-code-transformations/LoopCharacterizer";
import IdGenerator from "@specs-feup/lara/api/lara/util/IdGenerator.js";
import Timer from "@specs-feup/clava/api/lara/code/Timer.js";
import { TimerUnit } from "@specs-feup/lara/api/lara/util/TimeUnits.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";

export class CodeInstrumenter extends AStage {
    #prefix;
    #timingsCsv = "task_timings.csv";
    #iterationsCsv = "loop_iterations.csv";

    constructor(topFunction: string, prefix: string = "TASK_TIMING") {
        super("CTFlow-Preprocessor-Instrumenter", topFunction);
        this.#prefix = prefix;
    }

    instrument(): void {
        this.instrumentTaskTimings();
        this.instrumentLoopIterations();
    }

    instrumentTaskTimings(): string[] {
        const flags: Set<string> = new Set();

        for (const fun of Query.search(FunctionJp)) {
            const body = fun.body;
            if (body != undefined && body.children.length > 0) {
                const flag = this.#instrumentScope(body, fun.name);
                flags.add(flag);
            }
        }
        return Array.from(flags);
    }

    instrumentLoopIterations(): void {
        for (const loop of Query.search(Loop)) {
            const props = LoopCharacterizer.characterize(loop);
            if (props.tripCount == -1) {
                this.#instrumentLoop(loop, props);
            }
        }
    }

    #instrumentLoop(loop: Loop, props: LoopCharacterization): void {
        const counterName = IdGenerator.next("__iterCounter");
        const preStmt = `int ${counterName} = 0;`;

        const bodyStmt = `${counterName}++;`;

        const outputFileVarName = IdGenerator.next("__loopIterationsFile");
        const postStmts = [
            `FILE * ${outputFileVarName};`,
            `${outputFileVarName} = fopen("${this.#iterationsCsv}", "a");`,
            `fprintf(${outputFileVarName}, "${loop.location},%d\n", __iterCounter)`,
            `fclose(${outputFileVarName});`
        ];

        // Missing: insert statements
    }

    #instrumentScope(scope: Scope, name: string) {
        const firstStmt = scope.children[0];
        const lastStmt = scope.children[scope.children.length - 1];

        const timer = new Timer(TimerUnit.MICROSECONDS, this.#timingsCsv);
        timer.time(firstStmt, `${name},`, lastStmt);

        const flag = `${this.#prefix}_${name.toUpperCase()}`;
        const startGuard1 = ClavaJoinPoints.stmtLiteral(`#ifdef ${flag}`);
        const startGuard2 = ClavaJoinPoints.stmtLiteral(`#endif // ${flag}`);

        const endGuard1 = ClavaJoinPoints.stmtLiteral(`#ifdef ${flag}`);
        const endGuard2 = ClavaJoinPoints.stmtLiteral(`#endif // ${flag}`);

        scope.children[0].insertBefore(startGuard1);
        firstStmt.insertBefore(startGuard2);
        lastStmt.insertAfter(endGuard1);
        scope.children[scope.children.length - 1].insertAfter(endGuard2);

        return flag;
    }
}