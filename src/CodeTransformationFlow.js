"use strict";

laraImport("UPTStage");
laraImport("OutputDirectories");
laraImport("analysis/ast/ApplicationAnalyser");
laraImport("preprocessing/SubsetPreprocessor");
laraImport("preprocessing/TaskPreprocessor");
laraImport("preprocessing/CodeInstrumenter");
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

        // push AST
        //this.instrumentCode();
        this.generateInstrumentedTaskCode();
        // pop AST

        this.log("Code transformation flow finished successfully!");
    }

    generateOriginalCode() {
        ClavaUtils.generateCode(this.getOutputDir(), OutputDirectories.SRC_ORIGINAL);
        this.log(`Original source code with resolved #defines written to ${OutputDirectories.SRC_ORIGINAL}`);
    }

    initialAnalysis() {
        this.log("Running initial analysis step");
        const outDir = this.getOutputDir() + "/" + OutputDirectories.APP_STATS_ORIGINAL;
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
        ClavaUtils.generateCode(this.getOutputDir(), OutputDirectories.SRC_SUBSET);
        this.log(`Intermediate subset-reduced source code written to ${OutputDirectories.SRC_SUBSET}`)
    }

    taskPreprocessing() {
        this.log("Running task preprocessing step");
        const outDir = this.getOutputDir();
        const appName = this.getAppName();
        const topFun = this.getTopFunction();

        const preprocessor = new TaskPreprocessor(topFun, outDir, appName);
        preprocessor.outlineAll();
        preprocessor.insertTimer();
    }

    intermediateAnalysis() {
        this.log("Running intermediate analysis step");
        const outDir = this.getOutputDir() + "/" + OutputDirectories.APP_STATS_TASKS;
        const appName = this.getAppName();
        const topFun = this.getTopFunction();

        const analyser = new ApplicationAnalyser(topFun, outDir, appName);
        analyser.runAllTasks();
    }

    generateTaskCode() {
        ClavaUtils.generateCode(this.getOutputDir(), OutputDirectories.SRC_TASKS);
        this.log(`Intermediate task-based source code written to "${OutputDirectories.SRC_TASKS}"`);
    }

    instrumentCode() {
        this.log("Instrumenting code");
        const instrumenter = new CodeInstrumenter(this.getTopFunction());
        instrumenter.instrument();
        this.log("Code successfully instrumented");
    }

    generateInstrumentedTaskCode() {
        ClavaUtils.generateCode(this.getOutputDir(), OutputDirectories.SRC_TASKS_INSTRUMENTED);
        this.log(`Instrumented task-based source code written to "${OutputDirectories.SRC_TASKS_INSTRUMENTED}"`);
    }

}