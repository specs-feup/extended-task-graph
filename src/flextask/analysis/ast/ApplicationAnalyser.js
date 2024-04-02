"use strict";

laraImport("lara.Io");
laraImport("flextask/analysis/ast/AstDumper");
laraImport("flextask/analysis/ast/CallGraphDumper");
laraImport("flextask/analysis/ast/SourceCodeStats");
laraImport("flextask/AStage");

class ApplicationAnalyser extends AStage {
    constructor(topFunction, outputDir, appName) {
        super("CTFlow-ApplicationAnalyser", topFunction, outputDir, appName);
    }

    runAllTasks() {
        this.dumpAST();
        this.dumpCallGraph();
        this.generateStatistics();
    }

    dumpAST() {
        const dumper = new AstDumper();
        const str = dumper.dump();

        const path = this.saveToFile(str, "ast.txt");
        this.log(`AST dumped to file ${path}`);
    }

    dumpCallGraph() {
        const dumper = new CallGraphDumper();
        const topFun = this.getTopFunctionJoinPoint();

        const dot1 = dumper.dump(topFun, "TB");
        const path1 = this.saveToFile(dot1, "callgraph_tb.dot");
        this.log(`Call graph 1 dumped to files ${path1}`);

        const dot2 = dumper.dump(topFun, "LR");
        const path2 = this.saveToFile(dot2, "callgraph_lr.dot");
        this.log(`Call graph 2 dumped to files ${path2}`);
    }

    generateStatistics() {
        const codeStats = new SourceCodeStats();
        codeStats.generateAll();
        const str = codeStats.asCsv();

        const path = this.saveToFile(str, "code_stats.csv");
        this.log(`Generated source code statistics in file ${path}`);
    }
}