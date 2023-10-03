"use strict";

laraImport("weaver.Query");

class SourceCodeStats {
    #nFunctions = 0;

    constructor() { }

    generateAll() {
        this.#generateFunctionStats();
    }

    asCsv() {
        const csv = [];
        csv.push("nFunctions," + this.#nFunctions);
        return csv.join("\n");
    }

    #generateFunctionStats() {
        const nFunc = Query.search("function", { isImplementation: true }).chain().length;
        this.#nFunctions = nFunc;
    }
}