"use strict";

laraImport("weaver.Query");
laraImport("lara.code.Timer");

class AppTimerInserter {
    constructor() { }

    insertTimer(topFunction, filename = "timing_results.csv") {
        if (topFunction.name == "main") {
            return false;
        }
        else {
            for (const call of Query.search("call", { name: topFunction.name })) {
                this.#insertTimerAroundCall(call, filename);
            }
            return true;
        }
    }

    #insertTimerAroundCall(call, filename) {
        const timer = new Timer("MICROSECONDS", filename);
        timer.time(call);
    }
}