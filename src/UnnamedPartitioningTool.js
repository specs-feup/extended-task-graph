"use strict";

laraImport("InitialAnalysis")
laraImport("Preprocessor");
laraImport("UPTStage");

class UnnamedPartitioningTool extends UPTStage {
    #config;

    constructor(config) {
        super("Main");
        this.#config = config;
    }

    run() {
        println("*".repeat(100));
        this.runStages();
        println("*".repeat(100));
    }

    runStages() {
        this.log("Running UnnamedPartitioningTool");

        this.applyInitialConfig();

        this.initialAnalysis();

        this.preprocessing();

        this.log("Done");
    }

    applyInitialConfig() {
        if (!this.#config.hasOwnProperty("appName")) {
            config.appName = "default_app_name";
        }
        if (this.#config.hasOwnProperty("codeOutputDir")) {
            // update weaving folder
        }
        if (!this.#config.hasOwnProperty("statsOutputDir")) {
            const weavingDir = Clava.getWeavingFolder().toString();
            this.#config.statsOutputDir = weavingDir + "/" + this.#config.appName + "_output_stats";
        }
    }

    initialAnalysis() {
        this.log("Running initial analysis step");
        const analyser = new InitialAnalysis(this.#config.statsOutputDir, this.#config.appName);
        analyser.analyse();
    }

    preprocessing() {
        this.log("Running preprocessing step");
        const prepropcessor = new Preprocessor();
        prepropcessor.preprocess();
    }
}