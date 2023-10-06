"use strict";

laraImport("UPTStage");
laraImport("analysis/ast/ApplicationAnalyser");
laraImport("preprocessing/SubsetPreprocessor");
laraImport("preprocessing/TaskPreprocessor");
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

    applyInitialConfig() {
        if (!this.#config.hasOwnProperty("appName")) {
            UPTConfig.set("appName", "default_app_name");
        }
        if (!this.#config.hasOwnProperty("starterFunction")) {
            UPTConfig.set("starterFunction", "main");
        }
    }

    run() {
        this.log("Running code transformation flow");

        this.generateOriginalCode();
        this.initialAnalysis();

        const valid = this.subsetPreprocessing();
        if (!valid) {
            this.log("Aborting...");
            return;
        }
        this.generateSubsetCode();

        this.taskPreprocessing();
        this.intermediateAnalysis();
        this.generateTaskCode();

        this.log("Code transformation flow finished successfully!");
    }

    generateOriginalCode() {
        ClavaUtils.generateCode(this.getOutputDir(), "src_original");
        this.log("Original source code with resolved #defines written to \"src_original\"");
    }

    initialAnalysis() {
        this.log("Running initial analysis step");
        const outDir = this.getOutputDir() + "/app_stats_original"
        const appName = this.getAppName();
        const topFun = this.getTopFunction();

        const analyser = new ApplicationAnalyser(topFun, outDir, appName);
        analyser.dumpAST();
        analyser.dumpCallGraph();
    }

    subsetPreprocessing() {
        this.log("Running subset preprocessing step");
        const outDir = this.getOutputDir();
        const appName = this.getAppName();
        const topFun = this.getTopFunction();

        const preprocessor = new SubsetPreprocessor(topFun, outDir, appName);
        preprocessor.preprocess();

        const res = ClavaUtils.verifySyntax();
        this.log(res ? "Syntax verified" : "Syntax verification failed");
        return res;
    }

    generateSubsetCode() {
        ClavaUtils.generateCode(this.getOutputDir(), "src_subset");
        this.log("Intermediate subset-reduced source code written to \"src_subset\"");
    }

    taskPreprocessing() {
        this.log("Running task preprocessing step");
        const outDir = this.getOutputDir();
        const appName = this.getAppName();
        const topFun = this.getTopFunction();

        const preprocessor = new TaskPreprocessor(topFun, outDir, appName);
        preprocessor.outlineAll();
        preprocessor.insertTimer();
        const symbols = preprocessor.insertInstrumentation();

        this.saveToFileInSubfolder(symbols, "symbols.txt", "src_tasks");
        this.log("Symbols for profiling written to \"src_tasks/symbols.txt\"");
    }

    intermediateAnalysis() {
        this.log("Running intermediate analysis step");
        const outDir = this.getOutputDir() + "/app_stats_tasks"
        const appName = this.getAppName();
        const topFun = this.getTopFunction();

        const analyser = new ApplicationAnalyser(topFun, outDir, appName);
        analyser.runAllTasks();
    }

    generateTaskCode() {
        ClavaUtils.generateCode(this.getOutputDir(), "src_tasks");
        this.log("Intermediate task-based source code written to \"src_tasks\"");
    }
}