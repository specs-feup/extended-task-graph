"use strict";

laraImport("UPTStage");
laraImport("analysis/ast/ApplicationAnalyser");
laraImport("preprocessing/Preprocessor");
laraImport("util/ClavaUtils");

class CodeTransformationFlow extends UPTStage {
    #config;

    constructor(config) {
        super("CTFlow",
            config["starterFunction"],
            config["outputDir"],
            config["appName"]);
        this.#config = config;
    }

    run() {
        this.log("Running code transformation flow");

        this.initialAnalysis();

        const valid = this.preprocessing();

        if (!valid) {
            this.log("Aborting...");
            return;
        }

        this.intermediateAnalysis();

        this.log("Code transformation flow finished successfully!");
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
        const topFun = this.getTopFunction();

        const analyser = new ApplicationAnalyser(topFun, outDir, appName);
        analyser.dumpAST();
        analyser.dumpCallGraph();
    }

    preprocessing() {
        this.log("Running preprocessing step");
        const outDir = this.getOutputDir();
        const appName = this.getAppName();
        const topFun = this.getTopFunction();

        const prepropcessor = new Preprocessor(topFun, outDir, appName);
        prepropcessor.preprocess();

        const res = ClavaUtils.verifySyntax();
        this.log(res ? "Syntax verified" : "Syntax verification failed");
        return res;
    }

    intermediateAnalysis() {
        this.log("Running intermediate analysis step");
        const outDir = this.getOutputDir() + "/app_stats_inter"
        const appName = this.getAppName();
        const topFun = this.getTopFunction();

        const analyser = new ApplicationAnalyser(topFun, outDir, appName);
        analyser.runAllTasks();

        ClavaUtils.generateCode(this.getOutputDir(), "src_inter_tasks");
        this.log("Intermediate task-based source code written to \"src_inter_tasks\"");
    }
}