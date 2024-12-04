import chalk from "chalk";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { LiteBenchmarkLoader } from "clava-lite-benchmarks/LiteBenchmarkLoader";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runEtgForBenchmark(config: Record<string, any>): boolean {
    for (const app of config.apps) {
        log(`Running ETG flows for app ${app} of benchmark suite ${config.suite.name}`);
        const cachedPath = `${config.outputDir}/${app}/src/trans`;
        let topFunctionName = "<none>";

        let invalidCache = false;
        if (config.disableCaching) {
            log(`Caching is disabled, loading full benchmark for app ${app}...`);
            topFunctionName = LiteBenchmarkLoader.load(config.suite, app);
            if (topFunctionName === "<none>") {
                log(`Could not load app ${app}, skipping...`);
                continue;
            }
            invalidCache = true;
            log(`Loaded full benchmark for app ${app} with top function ${topFunctionName}`);
        }
        else {
            log(`Trying to load cached app ${app} from ${cachedPath}...`);
            topFunctionName = LiteBenchmarkLoader.load(config.suite, app, cachedPath);

            if (topFunctionName === "<none>") {
                log(`Could not load cached app ${app}, loading full benchmark instead`);
                invalidCache = true;

                log(`Loading full benchmark for app ${app}...`);
                topFunctionName = LiteBenchmarkLoader.load(config.suite, app);
                if (topFunctionName === "<none>") {
                    log(`Could not load app ${app}, skipping...`);
                    return false;
                }
                log(`Loaded full benchmark for app ${app} with top function ${topFunctionName}`);
            }
            else {
                log(`Loaded cached app ${app} with top function ${topFunctionName}`);
            }
        }
        const api = new ExtendedTaskGraphAPI(topFunctionName, config.outputDir, app);

        try {
            if (invalidCache) {
                const success = api.runCodeTransformationFlow(config.codeConfig);

                if (!success) {
                    log(`Code transformation flow failed for app ${app}`);
                    log("-".repeat(58));
                    continue;
                }
            }
            api.runTaskGraphGenerationFlow(config.etgConfig);

            log(`Finished running ETG flows for app ${app} of benchmark suite ${config.suite.name}`);

        } catch (e) {
            log((e instanceof Error) ? e.message : String(e));
            log(`${chalk.red("Error: ")} exception while running ETG flows for app ${app} of benchmark suite ${config.suite.name}`);
        }
        log("-".repeat(58));
        Clava.popAst();
    }
    if (config.apps.length > 1) {
        log(`Finished running ETG flows for ${config.apps.length} apps from benchmark suite ${config.suite.name}`);
    }
    return true;
}

function log(msg: string): void {
    const header = chalk.yellowBright("BenchmarkRunner");
    console.log(`[${header}] ${msg}`);
}