/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";
import { SuiteRunner } from "./SuiteRunner.js";

export class EtgSuiteRunner extends SuiteRunner {
    protected getScriptName(): string {
        return "ETG flows";
    }

    protected runPrologue(app: string, topFunctionName: string, config: Record<string, any>): boolean {
        const api = new ExtendedTaskGraphAPI(topFunctionName, config.outputDir, app);
        return api.runCodeTransformationFlow(config.codeConfig);
    }

    protected runScript(app: string, topFunctionName: string, config: Record<string, any>): void {
        const api = new ExtendedTaskGraphAPI(topFunctionName, config.outputDir, app);
        api.runTaskGraphGenerationFlow(config.etgConfig);
    }

}