import { LiteBenchmarkLoader, BenchmarkSuite } from "./LiteBenchmarkLoader.js";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";
import chalk from "chalk";

export function runEtgForBenchmark(suite: BenchmarkSuite, apps: string[], settings: Record<string, boolean | string>): boolean {

    for (const app of apps) {
        log(`Running ETG flows for app ${app} of benchmark suite ${suite.name}`);
        const outputDir = settings.outputDir as string;
        const cachedPath = `${outputDir}/${app}/src/trans`;

        let invalidCache = false;
        log(`Trying to load cached app ${app} from ${cachedPath}...`);
        let topFunctionName = LiteBenchmarkLoader.load(suite, app, cachedPath);

        if (topFunctionName === "<none>") {
            log(`Could not load cached app ${app}, loading full benchmark instead`);
            invalidCache = true;

            log(`Loading full benchmark for app ${app}...`);
            topFunctionName = LiteBenchmarkLoader.load(suite, app);
            if (topFunctionName === "<none>") {
                log(`Could not load app ${app}, skipping...`);
                return false;
            }
            log(`Loaded full benchmark for app ${app} with top function ${topFunctionName}`);
        }
        else {
            log(`Loaded cached app ${app} with top function ${topFunctionName}`);
        }
        const api = new ExtendedTaskGraphAPI(topFunctionName, outputDir, app);

        if (invalidCache) {
            const dumpAST = settings.dumpAST as boolean;
            const doTransformations = settings.doTransformations as boolean;
            const dumpCallGraph = settings.dumpCallGraph as boolean;
            api.runCodeTransformationFlow(dumpCallGraph, dumpAST, doTransformations);
        }

        const generateGraph = settings.generateGraph as boolean;
        const gatherMetrics = settings.gatherMetrics as boolean;
        api.runTaskGraphGenerationFlow(generateGraph, gatherMetrics);

        log(`Finished running ETG flows for app ${app} of benchmark suite ${suite.name}`);
    }
    if (apps.length > 1) {
        log(`Finished running ETG flows for ${apps.length} apps from benchmark suite ${suite.name}`);
    }
    return true;
}

function log(msg: string): void {
    const header = chalk.magentaBright("BenchmarkRunner");
    console.log(`[${header}] ${msg}`);
}