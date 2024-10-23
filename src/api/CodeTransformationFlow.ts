import { AStage } from "../AStage.js";
import { ProfilingInstrumenter } from "../preprocessing/profiling/ProfilingInstrumenter.js";
import { SubsetPreprocessor } from "../preprocessing/subset/SubsetPreprocessor.js";
import { TaskPreprocessor } from "../preprocessing/task/TaskPreprocessor.js";
import { ClavaUtils } from "../util/ClavaUtils.js";
import { ApplicationAnalyser } from "../analysis/ast/ApplicationAnalyser.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { AppDumpOutput, SourceCodeOutput } from "./OutputDirectories.js";

export class CodeTransformationFlow extends AStage {
    constructor(topFunctionName: string, outputDir: string, appName: string) {
        super("TransFlow",
            topFunctionName,
            outputDir,
            appName);
    }

    public run(dumpCallGraph: boolean = true, dumpAST: boolean = true, doTransformations: boolean = true): boolean {
        this.logStart();
        this.log("Running code transformation flow");

        this.generateOriginalCode();
        this.initialAnalysis(dumpCallGraph, dumpAST);

        if (!doTransformations) {
            this.log("Transformations disabled, ending here");
            this.logEnd();
            return true;
        }
        this.logLine();

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

        Clava.pushAst();
        this.applyProfilingInstrumentation();
        this.generateInstrumentedCode();
        this.logSuccess("Instrumentation finished successfully!");
        this.logLine();
        Clava.popAst();

        this.intermediateAnalysis(dumpCallGraph, dumpAST);
        this.logLine();

        this.logSuccess("Code transformation flow finished successfully!");
        this.logEnd();
        return true;
    }

    public generateOriginalCode(): void {
        const path = this.generateCode(SourceCodeOutput.SRC_ORIGINAL);
        this.logOutput("Original source code with resolved #defines written to ", path);
    }

    public initialAnalysis(dumpCallGraph: boolean, dumpAST: boolean): void {
        this.log("Running initial analysis step");
        const outDir = `${this.getOutputDir()}/${AppDumpOutput.APP_STATS_PARENT}/${AppDumpOutput.APP_STATS_ORIGINAL}`;
        this.genericAnalysisStep(outDir, dumpCallGraph, dumpAST, false);
    }

    public subsetPreprocessing(): boolean {
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

    public verifySyntax(): boolean {
        const res = ClavaUtils.verifySyntax();
        if (res) {
            this.log("Syntax verified");
        }
        else {
            this.logError("Syntax verification failed");
        }
        return res;
    }

    public generateSubsetCode(): void {
        const path = this.generateCode(SourceCodeOutput.SRC_SUBSET);
        this.logOutput("Intermediate subset-reduced source code written to ", path);
    }

    public taskPreprocessing(): void {
        this.log("Running task preprocessing step");
        const outDir = this.getOutputDir();
        const appName = this.getAppName();
        const topFun = this.getTopFunctionName();

        const preprocessor = new TaskPreprocessor(topFun, outDir, appName);
        preprocessor.preprocess();
    }

    public intermediateAnalysis(dumpCallGraph: boolean, dumpAST: boolean): void {
        this.log("Running intermediate analysis step");
        const outDir = `${this.getOutputDir()}/${AppDumpOutput.APP_STATS_PARENT}/${AppDumpOutput.APP_STATS_TASKS}`;
        this.genericAnalysisStep(outDir, dumpCallGraph, dumpAST, false);
    }

    public generateTaskCode(): void {
        const path = this.generateCode(SourceCodeOutput.SRC_TASKS);
        this.logOutput("Intermediate task-based source code written to ", path);
    }

    public applyProfilingInstrumentation(): void {
        this.log("Running profiling instrumentation step");

        const instrumenter = new ProfilingInstrumenter(this.getTopFunctionName());
        instrumenter.instrumentAll();
    }

    public generateInstrumentedCode(): void {
        const path = this.generateCode(SourceCodeOutput.SRC_TASKS_INSTRUMENTED);
        this.logOutput("Instrumented task-based source code written to ", path);
    }

    public generateCode(subfolder: string): string {
        return ClavaUtils.generateCode(this.getOutputDir(), `${SourceCodeOutput.SRC_PARENT}/${subfolder}`);
    }

    private genericAnalysisStep(outDir: string, dumpCallGraph: boolean, dumpAST: boolean, generateStatistics: boolean): void {
        const appName = this.getAppName();
        const topFun = this.getTopFunctionName();

        const analyser = new ApplicationAnalyser(topFun, outDir, appName);
        analyser.runAllTasks(dumpCallGraph, dumpAST, generateStatistics);
    }
}