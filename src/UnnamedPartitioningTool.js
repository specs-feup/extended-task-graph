"use strict";

laraImport("ApplicationAnalyser");
laraImport("Preprocessor");
laraImport("UPTStage");
laraImport("util.ClavaUtils");

class UnnamedPartitioningTool extends UPTStage {
    #config;

    constructor(config) {
        super("Main");
        this.#config = config;
        this.applyInitialConfig();
        this.setAppName(this.#config["appName"]);
        this.setOutputDir(this.#config["outputDir"]);
    }

    run() {
        println("*".repeat(100));
        this.runStages();
        println("*".repeat(100));
    }

    runStages() {
        this.log("Running UnnamedPartitioningTool for application \"" + this.getAppName() + "\"");

        this.initialAnalysis();

        const valid = this.preprocessing();

        if (!valid) {
            this.log("Aborting...");
            return;
        }

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
        const outDir = this.getOutputDir() + "/app_stats_init"
        const appName = this.getAppName();
        const analyser = new ApplicationAnalyser(outDir, appName);
        analyser.dumpAST();
        analyser.dumpCallGraph();
    }

    preprocessing() {
        this.log("Running preprocessing step");
        const starterFunction = this.#config["starterFunction"];
        const outDir = this.getOutputDir();
        const appName = this.getAppName();

        const prepropcessor = new Preprocessor(starterFunction, outDir, appName);
        prepropcessor.preprocess();

        const res = ClavaUtils.verifySyntax();
        this.log(res ? "Syntax verified" : "Syntax verification failed");
        return res;
    }

    intermediateAnalysis() {
        this.log("Running intermediate analysis step");
        const outDir = this.getOutputDir() + "/app_stats_inter"
        const appName = this.getAppName();

        const analyser = new ApplicationAnalyser(outDir, appName);
        analyser.runAllTasks();

        ClavaUtils.generateCode(this.getOutputDir(), "src_inter_tasks");
        this.log("Intermediate task-based source code written to \"src_inter_tasks\"");
    }
}