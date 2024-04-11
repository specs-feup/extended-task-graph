"use strict";

laraImport("lara.Io");
laraImport("flextask/analysis/ast/AstDumper");
laraImport("flextask/analysis/ast/CallGraphDumper");
laraImport("flextask/analysis/ast/CallTreeDumper");
laraImport("flextask/analysis/ast/SourceCodeStats");
laraImport("flextask/AStage");

class ApplicationAnalyser extends AStage {
    constructor(topFunction, outputDir, appName) {
        super("CTFlow-ApplicationAnalyser", topFunction, outputDir, appName);
    }

    runAllTasks(dumpCallGraph = true, dumpAST = true, generateStatistics = true) {
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

    dumpAST() {
        const dumper = new AstDumper();
        const str = dumper.dump();

        const path = this.saveToFile(str, "ast.txt");
        this.logOutput("AST dumped to", path);
    }

    dumpCallGraph(startFromMain = true) {
        const dumper = new CallGraphDumper();
        const topFun = startFromMain ?
            Query.search("function", { name: "main" }).first() :
            this.getTopFunctionJoinPoint();

        const dot1 = dumper.dump(topFun, "TB");
        const path1 = this.saveToFile(dot1, "callgraph_tb.dot");
        this.logOutput("Call graph TB dumped to", path1);

        const dot2 = dumper.dump(topFun, "LR");
        const path2 = this.saveToFile(dot2, "callgraph_lr.dot");
        this.logOutput("Call graph LR dumped to", path2);
    }

    dumpCallTree(startFromMain = true) {
        const dumper = new CallTreeDumper();
        const topFun = startFromMain ?
            Query.search("function", { name: "main" }).first() :
            this.getTopFunctionJoinPoint();

        const dot1 = dumper.dump(topFun, "TB");
        const path1 = this.saveToFile(dot1, "calltree_tb.dot");
        this.logOutput("Call tree TB dumped to", path1);

        const dot2 = dumper.dump(topFun, "LR");
        const path2 = this.saveToFile(dot2, "calltree_lr.dot");
        this.logOutput("Call tree LR dumped to", path1);
    }

    generateStatistics() {
        const codeStats = new SourceCodeStats();
        codeStats.generateAll();
        const str = codeStats.asCsv();

        const path = this.saveToFile(str, "code_stats.csv");
        this.log(`Generated source code statistics in file ${path}`);
    }
}