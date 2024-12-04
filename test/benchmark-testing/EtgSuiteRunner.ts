/* eslint-disable @typescript-eslint/no-explicit-any */
import { SuiteRunner } from "clava-lite-benchmarks/SuiteRunner";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";

export class EtgSuiteRunner extends SuiteRunner {
    protected getScriptName(): string {
        return "ETG flows";
    }

    protected runScript(app: string, topFunctionName: string, isCached: boolean, config: Record<string, any>): boolean {
        const api = new ExtendedTaskGraphAPI(topFunctionName, config.outputDir, app);

        if (!isCached) {
            const success = api.runCodeTransformationFlow(config.codeConfig);
            if (!success) {
                return false;
            }
        }
        const etg = api.runTaskGraphGenerationFlow(config.etgConfig);
        return etg != null;
    }
}