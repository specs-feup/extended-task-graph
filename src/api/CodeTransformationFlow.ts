import { AStage } from "../AStage.js";
import { OutputDirectories } from "./OutputDirectories.js";
import { CodeInstrumenter } from "../preprocessing/CodeInstrumenter.js";
import { SubsetPreprocessor } from "../preprocessing/subset/SubsetPreprocessor.js";
import { TaskPreprocessor } from "../preprocessing/task/TaskPreprocessor.js";
import { ClavaUtils } from "../util/ClavaUtils.js";
import { ApplicationAnalyser } from "../analysis/ast/ApplicationAnalyser.js";

export class CodeTransformationFlow extends AStage {
    constructor(topFunctionName: string, outputDir: string, appName: string) {
        super("TransFlow",
            topFunctionName,
            outputDir,
            appName);
    }

    run(dumpCallGraph: boolean = true, dumpAST: boolean = true, doTransformations: boolean = true): boolean {
        this.logStart();
        this.log("Running code transformation flow");

        this.generateOriginalCode();
        this.initialAnalysis(dumpCallGraph, dumpAST);
        this.logLine();

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
        this.logSuccess("Subset preprocessing finished successfully!");
        this.logLine();

        this.taskPreprocessing();
        this.generateTaskCode();
        this.logSuccess("Task preprocessing finished successfully!");
        this.logLine();

        this.intermediateAnalysis(dumpCallGraph, dumpAST);
        this.logLine();

        this.logSuccess("Code transformation flow finished successfully!");
        this.logEnd();
        return true;
    }

    generateOriginalCode(): void {
        const outFolder = ClavaUtils.generateCode(this.getOutputDir(), OutputDirectories.SRC_ORIGINAL);
        this.logOutput("Original source code with resolved #defines written to", outFolder);
    }

    initialAnalysis(dumpCallGraph: boolean, dumpAST: boolean): void {
        this.log("Running initial analysis step");
        this.#genericAnalysisStep(OutputDirectories.APP_STATS_ORIGINAL, dumpCallGraph, dumpAST, false);
    }

    subsetPreprocessing(): boolean {
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

    verifySyntax(): boolean {
        const res = ClavaUtils.verifySyntax();
        if (res) {
            this.log("Syntax verified");
        }
        else {
            this.logError("Syntax verification failed");
        }
        return res;
    }

    generateSubsetCode(): void {
        ClavaUtils.generateCode(this.getOutputDir(), OutputDirectories.SRC_SUBSET);
        this.log(`Intermediate subset-reduced source code written to ${OutputDirectories.SRC_SUBSET}`)
    }

    taskPreprocessing(): void {
        this.log("Running task preprocessing step");
        const outDir = this.getOutputDir();
        const appName = this.getAppName();
        const topFun = this.getTopFunctionName();

        const preprocessor = new TaskPreprocessor(topFun, outDir, appName);
        preprocessor.preprocess();
    }

    intermediateAnalysis(dumpCallGraph: boolean, dumpAST: boolean): void {
        this.log("Running intermediate analysis step");
        this.#genericAnalysisStep(OutputDirectories.APP_STATS_TASKS, dumpCallGraph, dumpAST, false);
    }

    generateTaskCode(): void {
        ClavaUtils.generateCode(this.getOutputDir(), OutputDirectories.SRC_TASKS);
        this.log(`Intermediate task-based source code written to "${OutputDirectories.SRC_TASKS}"`);
    }

    generateInstrumentedTaskCode(): void {
        // push AST
        const instrumenter = new CodeInstrumenter(this.getTopFunctionName());
        //instrumenter.instrument();

        ClavaUtils.generateCode(this.getOutputDir(), OutputDirectories.SRC_TASKS_INSTRUMENTED);
        this.log(`Instrumented task-based source code written to "${OutputDirectories.SRC_TASKS_INSTRUMENTED}"`);
        // pop ASTs
    }

    #genericAnalysisStep(folder: string, dumpCallGraph: boolean, dumpAST: boolean, generateStatistics: boolean): void {
        const outDir = this.getOutputDir() + "/" + folder;
        const appName = this.getAppName();
        const topFun = this.getTopFunctionName();

        const analyser = new ApplicationAnalyser(topFun, outDir, appName);
        analyser.runAllTasks(dumpCallGraph, dumpAST, generateStatistics);
    }
}