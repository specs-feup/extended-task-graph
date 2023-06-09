"use strict";

laraImport("ApplicationAnalyser");
laraImport("Preprocessor");
laraImport("UPTStage");
laraImport("UPTUtils");

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
        this.applyInitialConfig();

        this.log("Running UnnamedPartitioningTool for application \"" + this.#config["appName"] + "\"");

        this.initialAnalysis();

        const valid = this.preprocessing();
        /*
        if (!valid) {
            this.log("Aborting...");
            return;
        }*/

        this.intermediateAnalysis();

        this.log("Done");
    }

    applyInitialConfig() {
        if (!this.#config.hasOwnProperty("appName")) {
            UPTConfig.set("appName", "default_app_name");
        }
        if (!this.#config.hasOwnProperty("starterFunction")) {
            UPTConfig.set("starterFunction", "main");
        }
    }

    initialAnalysis() {
        this.log("Running initial analysis step");
        const outDir = this.#config["outputDir"] + "/app_stats_init"
        const appName = this.#config["appName"];
        const analyser = new ApplicationAnalyser(outDir, appName);
        analyser.runAllTasks();
    }

    preprocessing() {
        this.log("Running preprocessing step");
        const starterFunction = this.#config["starterFunction"];
        const prepropcessor = new Preprocessor(starterFunction);
        prepropcessor.preprocess();

        const res = UPTUtils.verifySyntax();
        this.log(res ? "Syntax verified" : "Syntax verification failed");
        return res;
    }

    intermediateAnalysis() {
        this.log("Running intermediate analysis step");
        const outDir = this.#config["outputDir"] + "/app_stats_inter"
        const appName = this.#config["appName"];
        const analyser = new ApplicationAnalyser(outDir, appName);
        analyser.runAllTasks();

        UPTUtils.generateCode(this.#config["outputDir"], "src_inter");
        this.log("Intermediate source code written to src_inter");
    }
}