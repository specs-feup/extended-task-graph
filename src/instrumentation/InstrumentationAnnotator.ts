import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { Call, FunctionJp, Loop } from "@specs-feup/clava/api/Joinpoints.js";
import { EtgLogger } from "@specs-feup/extended-task-graph/EtgLogger";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { readFileSync } from "fs";

export class InstrumentationAnnotator {
    private logger: EtgLogger;
    private functionCache = new Map<string, FunctionJp>();

    constructor(outputDir: string, appName: string) {
        this.logger = new EtgLogger("InstrAnnotator", outputDir, appName, "ETG");
        this.functionCache = new Map<string, FunctionJp>();
    }

    public annotateAll(path: string): number {
        const json = this.readJsonFile(path);
        this.logger.log(`Annotating instrumentation data from ${path.split("/").pop()}`);

        const loopCounts = json["loop_counts"];
        if (!loopCounts) {
            this.logger.logError(`No loop_counts found in JSON file at ${path}.`);
            return 0;
        }
        const nLoops = this.annotateLoops(json["loop_counts"]);

        const mallocSizes = json["malloc_sizes"];
        if (!mallocSizes) {
            this.logger.logError(`No malloc_sizes found in JSON file at ${path}.`);
            return nLoops;
        }
        const nMallocs = this.annotateMallocs(json["malloc_sizes"]);

        this.logger.log(`Annotated ${nLoops} loops and ${nMallocs} mallocs.`);
        return nLoops + nMallocs;
    }

    private readJsonFile(path: string): InstrumentationSummary {
        try {
            const file = readFileSync(path, "utf-8");
            if (!file) {
                this.logger.logError(`JSON file at ${path} is empty or could not be read.`);
                return { loop_counts: {}, malloc_sizes: {} };
            }
            return JSON.parse(file) as InstrumentationSummary;
        }
        catch (error) {
            this.logger.logError(`Error reading JSON file at ${path}: ${error}`);
            return {
                loop_counts: {}, malloc_sizes: {}
            }
        }
    }

    private getFunction(funcName: string): FunctionJp {
        if (this.functionCache.has(funcName)) {
            return this.functionCache.get(funcName)!;
        }
        const fun = Query.search(FunctionJp, (f) => f.name == funcName && f.isImplementation).first();
        if (fun) {
            this.functionCache.set(funcName, fun);
            return fun;
        }
        this.logger.logError(`Function ${funcName} not found.`);
        throw new Error(`Function ${funcName} not found.`);
    }

    private annotateLoops(loopCounts: Record<string, [number, number, number]>): number {
        let annotatedLoops = 0;
        this.functionCache.clear();

        for (const [location, stats] of Object.entries(loopCounts)) {
            const [funcName, lineStr] = location.split(":");
            const fun = this.getFunction(funcName);
            const line = parseInt(lineStr);
            const [min, max, avg] = stats;

            const loop = Query.searchFrom(fun, Loop, (l) => l.line == line).get()[0];
            if (!loop) {
                this.logger.logError(`Loop at ${location} not found in function ${funcName}.`);
                continue;
            }

            const pragmaStr = (avg >= max || avg >= min) ?
                `#pragma HLS loop_tripcount max=${max} min=${min}` :
                `#pragma HLS loop_tripcount max=${max} min=${min} avg=${avg}`;
            const pragmaStmt = ClavaJoinPoints.stmtLiteral(pragmaStr);
            loop.body.insertBegin(pragmaStmt);
            annotatedLoops++;
            this.logger.log(` Annotated loop at ${location} with tripcount pragma.`);
        }
        return annotatedLoops;
    }

    private annotateMallocs(mallocSizes: Record<string, [number, number, number]>): number {
        let annotatedMallocs = 0;
        for (const [location, stats] of Object.entries(mallocSizes)) {
            const [funcName, lineStr] = location.split(":");
            const line = parseInt(lineStr);
            const [min, max, avg] = stats;

            const mallocCall = Query.search(Call, (c) => {
                return c.name == "malloc" && c.line == line;
            }).get()[0];
            if (!mallocCall) {
                this.logger.logError(`Malloc at ${location} not found in function ${funcName}.`);
                continue;
            }

            const pragmaStr = `#pragma clava malloc_size max=${max} min=${min} avg=${avg}`;
            const pragmaStmt = ClavaJoinPoints.stmtLiteral(pragmaStr);
            mallocCall.getAncestor("statement").insertBefore(pragmaStmt);
            annotatedMallocs++;
            this.logger.log(` Annotated malloc at ${location} with malloc_size pragma.`);
        }
        return annotatedMallocs;
    }
}

type InstrumentationSummary = {
    loop_counts: Record<string, [number, number, number]>,
    malloc_sizes: Record<string, [number, number, number]>
};