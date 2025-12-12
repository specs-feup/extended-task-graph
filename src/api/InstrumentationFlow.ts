import { existsSync } from "fs";
import { AStage } from "../AStage.js";
import { InstrumentationAnnotator } from "../instrumentation/InstrumentationAnnotator.js";
import { InstrumentationInserter } from "../instrumentation/InstrumentationInserter.js";
import { SourceCodeOutput } from "./OutputDirectories.js";

export class InstrumentationFlow extends AStage {
    constructor(topFunctionName: string, outputDir: string, appName: string) {
        super("InstrFlow",
            topFunctionName,
            outputDir,
            appName);
    }

    public instrumentApp(): void {
        this.log("Instrumenting application code");

        const instr = new InstrumentationInserter(this.getOutputDir(), this.getAppName());

        instr.createLoopsInstrumentationFile();
        for (const func of this.getValidFunctions()) {
            instr.instrumentLoops(func);
        }
        instr.instrumentMallocs();

        const dir = `${this.getAppName()}/${SourceCodeOutput.SRC_PARENT}/${SourceCodeOutput.SRC_FINAL_INSTRUMENTED}`;
        const path = this.generateCode(dir);
        this.logSuccess(`Generated instrumented code at: ${path}`);
    }

    public annotateApp(): void {
        this.log("Annotating application code");

        const annot = new InstrumentationAnnotator(this.getOutputDir(), this.getAppName());

        const prevPath = `${this.getOutputDir()}/${this.getAppName()}/${SourceCodeOutput.SRC_PARENT}/${SourceCodeOutput.SRC_FINAL_INSTRUMENTED}`;
        if (!existsSync(prevPath)) {
            this.logError(`Previous instrumented code not found at: ${prevPath}`);
            return;
        }
        const jsonPath = `${prevPath}/instrumentation_summary.json`;
        if (!existsSync(jsonPath)) {
            this.logError(`Instrumentation summary not found at: ${jsonPath}`);
            return;
        }
        annot.annotateAll(jsonPath);

        const dir = `${this.getAppName()}/${SourceCodeOutput.SRC_PARENT}/${SourceCodeOutput.SRC_FINAL_ANNOTATED}`;
        const path = this.generateCode(dir);
        this.logSuccess(`Generated annotated code at: ${path}`);
    }
}