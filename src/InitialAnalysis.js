"use strict";

laraImport("lara.Io");
laraImport("analysis/AstDumper");
laraImport("analysis/CallGraphDumper");

class InitialAnalysis {
    #outputDir
    #appName

    constructor(outputDir, appName) {
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
    }

    dumpCallGraph() {
        const dumper = new CallGraphDumper();
        const str = dumper.dump();
        this.saveToFile(str, "callgraph.dot");
    }

    saveToFile(str, filename) {
        Io.writeFile(this.#outputDir + "/" + this.#appName + "_" + filename, str);
    }
}