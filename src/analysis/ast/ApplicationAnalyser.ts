import { FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import { AStage } from "../../AStage.js";
import { DotSorting } from "../../util/DotSorting.js";
import { AstDumper } from "./AstDumper.js";
import { CallGraphDumper } from "./CallGraphDumper.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { CallTreeDumper } from "./CallTreeDumper.js";
import { SourceCodeStats } from "./SourceCodeStats.js";

export class ApplicationAnalyser extends AStage {
    constructor(topFunction: string, outputDir: string, appName: string) {
        super("TransFlow-AppAnalyser", topFunction, outputDir, appName);
    }

    public runAllTasks(dumpCallGraph = true, dumpAST = true, generateStatistics = true) {
        if (dumpCallGraph) {
            try {
                this.dumpCallGraph(true);
            } catch (e) {
                this.logTrace(e);
                this.logWarning("Failed to dump call graph");
            }
            try {
                this.dumpCallTree(true);
            }
            catch (e) {
                this.logTrace(e);
                this.logWarning("Failed to dump call tree");
            }
        }
        if (dumpAST) {
            try {
                this.dumpAST();
            } catch (e) {
                this.logTrace(e);
                this.logWarning("Failed to dump AST");
            }
        }
        if (generateStatistics) {
            try {
                this.generateStatistics();
            } catch (e) {
                this.logTrace(e);
                this.logWarning("Failed to generate statistics");
            }
        }
    }

    public dumpAST(): void {
        const dumper = new AstDumper();
        const str = dumper.dump();

        const path = this.saveToFile(str, "ast.txt");
        this.logOutput("AST dumped to", path);
    }

    public dumpCallGraph(startFromMain = true): void {
        const dumper = new CallGraphDumper();
        const topFun = startFromMain ?
            Query.search(FunctionJp, { name: "main" }).first()! :
            this.getTopFunctionJoinPoint();

        const dot1 = dumper.dump(topFun, DotSorting.TOP_TO_BOTTOM);
        const path1 = this.saveToFile(dot1, "callgraph_tb.dot");
        this.logOutput("Call graph TB dumped to", path1);

        const dot2 = dumper.dump(topFun, DotSorting.LEFT_TO_RIGHT);
        const path2 = this.saveToFile(dot2, "callgraph_lr.dot");
        this.logOutput("Call graph LR dumped to", path2);
    }

    public dumpCallTree(startFromMain = true): void {
        const dumper = new CallTreeDumper();
        const topFun = startFromMain ?
            Query.search(FunctionJp, { name: "main" }).first()! :
            this.getTopFunctionJoinPoint();

        const dot1 = dumper.dump(topFun, DotSorting.TOP_TO_BOTTOM);
        const path1 = this.saveToFile(dot1, "calltree_tb.dot");
        this.logOutput("Call tree TB dumped to", path1);

        const dot2 = dumper.dump(topFun, DotSorting.LEFT_TO_RIGHT);
        const path2 = this.saveToFile(dot2, "calltree_lr.dot");
        this.logOutput("Call tree LR dumped to", path1);
    }

    public generateStatistics(): void {
        const codeStats = new SourceCodeStats();
        codeStats.generateAll();
        const str = codeStats.asCsv();

        const path = this.saveToFile(str, "code_stats.csv");
        this.log(`Generated source code statistics in file ${path}`);
    }
}