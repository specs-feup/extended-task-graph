import { FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export class SourceCodeStats {
    private nFunctions: number = 0;

    constructor() { }

    public generateAll(): void {
        this.generateFunctionStats();
    }

    public asCsv(): string {
        const csv = [];
        csv.push("nFunctions," + this.nFunctions);
        return csv.join("\n");
    }

    private generateFunctionStats() {
        const nFunc = Query.search(FunctionJp, { isImplementation: true }).chain().length;
        this.nFunctions = nFunc;
    }
}