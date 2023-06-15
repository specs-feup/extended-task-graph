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

    runBothFlows() {
        this.#printLine();
        this.log("Running UnnamedPartitioningTool for application \"" + this.getAppName() + "\" using both flows");
        this.runCodeTransformationFlow();
        this.runHolisticFlow(false);
    }

    runCodeTransformationFlow() {
        this.#printLine();
        this.log("Running code transformation flow");

        this.initialAnalysis();

        const valid = this.preprocessing();

        if (!valid) {
            this.log("Aborting...");
            return;
        }

        this.intermediateAnalysis();

        this.log("Code transformation flow finished successfully!");
        this.#printLine();
    }

    runHolisticFlow(printFirstLine = true) {
        if (printFirstLine) {
            this.#printLine();
        }
        this.log("Running holistic HW/SW partitioning flow");

        // TODO

        this.log("Holistic HW/SW partitioning flow finished successfully!");
        this.#printLine();
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

    #printLine() {
        println("*".repeat(100));
    }
}