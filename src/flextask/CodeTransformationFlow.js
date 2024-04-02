"use strict";

laraImport("flextask/AStage");
laraImport("flextask/OutputDirectories");
laraImport("flextask/analysis/ast/ApplicationAnalyser");
laraImport("flextask/preprocessing/SubsetPreprocessor");
laraImport("flextask/preprocessing/TaskPreprocessor");
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
            this.log("Aborting...");
            return false;
        }

        this.generateSubsetCode();
        this.taskPreprocessing();
        this.intermediateAnalysis();
        this.generateTaskCode();
        this.generateInstrumentedTaskCode();

        this.log("Code transformation flow finished successfully!");
        return true;
    }

    generateOriginalCode() {
        ClavaUtils.generateCode(this.getOutputDir(), OutputDirectories.SRC_ORIGINAL);
        this.log(`Original source code with resolved #defines written to ${OutputDirectories.SRC_ORIGINAL}`);
    }

    initialAnalysis(dumpCallGraph, dumpAST) {
        this.log("Running initial analysis step");
        const outDir = this.getOutputDir() + "/" + OutputDirectories.APP_STATS_ORIGINAL;
        const appName = this.getAppName();
        const topFun = this.getTopFunctionName();

        const analyser = new ApplicationAnalyser(topFun, outDir, appName);
        if (dumpCallGraph) {
            try {
                analyser.dumpCallGraph();
            } catch (e) {
                this.log("Failed to dump call graph");
            }
        }
        if (dumpAST) {
            try {
                analyser.dumpAST();
            } catch (e) {
                this.log("Failed to dump AST");
            }
        }
    }

    subsetPreprocessing() {
        this.log("Running subset preprocessing step");
        const outDir = this.getOutputDir();
        const appName = this.getAppName();
        const topFun = this.getTopFunctionName();

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
        const topFun = this.getTopFunctionName();

        const preprocessor = new TaskPreprocessor(topFun, outDir, appName);
        preprocessor.outlineAll();
        preprocessor.insertTimer();
    }

    intermediateAnalysis() {
        this.log("Running intermediate analysis step");
        const outDir = this.getOutputDir() + "/" + OutputDirectories.APP_STATS_TASKS;
        const appName = this.getAppName();
        const topFun = this.getTopFunctionName();

        const analyser = new ApplicationAnalyser(topFun, outDir, appName);
        analyser.runAllTasks();
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

}