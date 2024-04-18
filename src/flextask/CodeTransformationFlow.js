"use strict";

laraImport("flextask/AStage");
laraImport("flextask/OutputDirectories");
laraImport("flextask/analysis/ast/ApplicationAnalyser");
laraImport("flextask/preprocessing/subset/SubsetPreprocessor");
laraImport("flextask/preprocessing/task/TaskPreprocessor");
laraImport("flextask/preprocessing/CodeInstrumenter");
laraImport("flextask/util/ClavaUtils");

class CodeTransformationFlow extends AStage {
    constructor(topFunctionName, outputDir, appName) {
        super("CTFlow",
            topFunctionName,
            outputDir,
            appName);
    }

    run(dumpCallGraph = true, dumpAST = true, doTransformations = true) {
        this.log("Running code transformation flow");

        this.generateOriginalCode();
        this.initialAnalysis(dumpCallGraph, dumpAST);

        if (!doTransformations) {
            this.log("Transformations disabled, skipping to the end");
            return true;
        }

        const valid = this.subsetPreprocessing();
        if (!valid) {
            this.logError("Critical error, aborting...");
            return false;
        }

        this.generateSubsetCode();
        this.taskPreprocessing();
        this.intermediateAnalysis(dumpCallGraph, dumpAST);
        this.generateTaskCode();
        this.generateInstrumentedTaskCode();

        this.logSuccess("Code transformation flow finished successfully!");
        return true;
    }

    generateOriginalCode() {
        const outFolder = ClavaUtils.generateCode(this.getOutputDir(), OutputDirectories.SRC_ORIGINAL);
        this.logOutput("Original source code with resolved #defines written to", outFolder);
    }

    initialAnalysis(dumpCallGraph, dumpAST) {
        this.log("Running initial analysis step");
        this.#genericAnalysisStep(OutputDirectories.APP_STATS_ORIGINAL, dumpCallGraph, dumpAST, false);
    }

    subsetPreprocessing() {
        this.log("Running subset preprocessing step");
        const outDir = this.getOutputDir();
        const appName = this.getAppName();
        const topFun = this.getTopFunctionName();

        const preprocessor = new SubsetPreprocessor(topFun, outDir, appName);
        const success = preprocessor.preprocess();

        if (!success) {
            return false;
        }

        return this.verifySyntax();
    }

    verifySyntax() {
        const res = ClavaUtils.verifySyntax();
        if (res) {
            this.logSuccess("Syntax verified");
        }
        else {
            this.logError("Syntax verification failed");
        }
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
        const topFun = this.getTopFunctionName();

        const preprocessor = new TaskPreprocessor(topFun, outDir, appName);
        preprocessor.preprocess();
    }

    intermediateAnalysis(dumpCallGraph, dumpAST) {
        this.log("Running intermediate analysis step");
        this.#genericAnalysisStep(OutputDirectories.APP_STATS_TASKS, dumpCallGraph, dumpAST, false);
    }

    generateTaskCode() {
        ClavaUtils.generateCode(this.getOutputDir(), OutputDirectories.SRC_TASKS);
        this.log(`Intermediate task-based source code written to "${OutputDirectories.SRC_TASKS}"`);
    }

    generateInstrumentedTaskCode() {
        // push AST
        const instrumenter = new CodeInstrumenter(this.getTopFunctionName());
        //instrumenter.instrument();

        ClavaUtils.generateCode(this.getOutputDir(), OutputDirectories.SRC_TASKS_INSTRUMENTED);
        this.log(`Instrumented task-based source code written to "${OutputDirectories.SRC_TASKS_INSTRUMENTED}"`);
        // pop ASTs
    }

    #genericAnalysisStep(folder, dumpCallGraph, dumpAST, generateStatistics) {
        const outDir = this.getOutputDir() + "/" + folder;
        const appName = this.getAppName();
        const topFun = this.getTopFunctionName();

        const analyser = new ApplicationAnalyser(topFun, outDir, appName);
        analyser.runAllTasks(dumpCallGraph, dumpAST, generateStatistics);
    }
}