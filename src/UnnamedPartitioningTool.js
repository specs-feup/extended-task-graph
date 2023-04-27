"use strict";

laraImport("InitialAnalysis")
laraImport("Preprocessor");

class UnnamedPartitioningTool {
    #config;

    constructor(config) {
        this.#config = config;
    }

    run() {
        this.log("Running UnnamedPartitioningTool");

        this.initialAnalysis();

        this.preprocessing();

        this.log("Done");
    }

    initialAnalysis() {
        this.log("Running initial analysis step");
        const analyser = new InitialAnalysis(this.#config.statsOutputDir);
        analyser.analyse();
    }

    preprocessing() {
        this.log("Running preprocessing step");
        const prepropcessor = new Preprocessor();
        prepropcessor.preprocess();
    }

    log(msg) {
        println("[UPT] " + msg);
    }
}