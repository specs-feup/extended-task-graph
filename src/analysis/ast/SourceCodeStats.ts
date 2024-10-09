import { FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export class SourceCodeStats {
    #nFunctions = 0;

    constructor() { }

    generateAll(): void {
        this.#generateFunctionStats();
    }

    asCsv(): string {
        const csv = [];
        csv.push("nFunctions," + this.#nFunctions);
        return csv.join("\n");
    }

    #generateFunctionStats() {
        const nFunc = Query.search(FunctionJp, { isImplementation: true }).chain().length;
        this.#nFunctions = nFunc;
    }
}