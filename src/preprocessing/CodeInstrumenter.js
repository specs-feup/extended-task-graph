"use strict";

laraImport("weaver.Query");
laraImport("lara.code.Timer");
laraImport("lara.util.IdGenerator");
laraImport("flextask/AStage");
laraImport("clava.code.LoopCharacterizer");

class CodeInstrumenter extends AStage {
    #prefix;
    #timingsCsv = "task_timings.csv";
    #iterationsCsv = "loop_iterations.csv";

    constructor(topFunction, prefix = "TASK_TIMING") {
        super("CTFlow-Preprocessor-Instrumenter", topFunction);
        this.#prefix = prefix;
    }

    instrument() {
        this.instrumentTaskTimings();
        this.instrumentLoopIterations();
    }

    instrumentTaskTimings() {
        const flags = new Set();

        for (const fun of Query.search("function")) {
            const body = fun.body;
            if (body != undefined && body.children.length > 0) {
                const flag = this.#instrumentScope(body, fun.name);
                flags.add(flag);
            }
        }
        return Array.from(flags);
    }

    instrumentLoopIterations() {
        for (const loop of Query.search("loop")) {
            const props = LoopCharacterizer.characterize(loop);
            if (props.tripCount == -1) {
                this.#instrumentLoop(loop);
            }
        }
    }

    #instrumentLoop(loop) {
        const counterName = IdGenerator.next("__iterCounter");
        const preStmt = `int ${counterName} = 0;`;

        const bodyStmt = `${iterCounter}++;`;

        const outputFileVarName = IdGenerator.next("__loopIterationsFile");
        const postStmts = [
            `FILE * ${outputFileVarName};`,
            `${outputFileVarName} = fopen("${this.#iterationsCsv}", "a");`,
            `fprintf(${outputFileVarName}, "${loop.location},%d\n", __iterCounter)`,
            `fclose(${outputFileVarName});`
        ];
    }

    #instrumentScope(scope, name) {
        const firstStmt = scope.children[0];
        const lastStmt = scope.children[scope.children.length - 1];

        const timer = new Timer("MICROSECONDS", this.#timingsCsv);
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