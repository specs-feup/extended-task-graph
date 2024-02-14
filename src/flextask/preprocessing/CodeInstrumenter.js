"use strict";

laraImport("weaver.Query");
laraImport("lara.code.Timer");
laraImport("flextask/AStage");

class CodeInstrumenter extends AStage {
    #prefix;
    #outputName;

    constructor(topFunction, prefix = "TASK_TIMING", outputName = "task_timings.csv") {
        super("CTFlow-Preprocessor-Instrumenter", topFunction);
        this.#prefix = prefix;
        this.#outputName = outputName;
    }

    instrument() {
        const flags = new Set();

        for (const fun of Query.search("function")) {
            const body = fun.body;
            if (body != undefined && body.children.length > 0) {
                const flag = this.instrumentScope(body, fun.name);
                flags.add(flag);
            }
        }
        return Array.from(flags);
    }

    instrumentScope(scope, name) {
        const firstStmt = scope.children[0];
        const lastStmt = scope.children[scope.children.length - 1];

        const timer = new Timer("MICROSECONDS", this.#outputName);
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