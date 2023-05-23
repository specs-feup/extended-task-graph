"use strict";

laraImport("lara.Io");
laraImport("analysis/AstDumper");
laraImport("analysis/CallGraphDumper");
laraImport("UPTStage");

class InitialAnalysis extends UPTStage {
    #outputDir
    #appName

    constructor(outputDir, appName) {
        super("InitialAnalysis")
        this.#outputDir = outputDir;
        this.#appName = appName;
    }

    analyse() {
        this.dumpAST();
        this.dumpCallGraph();
    }

    dumpAST() {
        const dumper = new AstDumper();
        const str = dumper.dump();
        this.saveToFile(str, "ast.txt");
        this.log("AST dumped to file ast.txt");
    }

    dumpCallGraph() {
        const dumper = new CallGraphDumper();
        const str = dumper.dump();
        this.saveToFile(str, "callgraph.dot");
        this.log("Call graph dumped to file callgraph.dot")
    }

    saveToFile(str, filename) {
        Io.writeFile(this.#outputDir + "/" + this.#appName + "_" + filename, str);
    }
}