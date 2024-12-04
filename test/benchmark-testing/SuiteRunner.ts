/* eslint-disable @typescript-eslint/no-explicit-any */
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import chalk from "chalk";
import { BenchmarkSuite, LiteBenchmarkLoader } from "clava-lite-benchmarks/LiteBenchmarkLoader";

export abstract class SuiteRunner {
    private lineLength;

    constructor(lineLength: number = 58) {
        this.lineLength = lineLength;
    }

    public runFlowForSuite(suite: BenchmarkSuite, apps: string[], config: Record<string, any>, disableCaching: boolean = true): boolean {
        for (const app of apps) {
            this.log(`Running ${this.getScriptName()} for app ${app} of benchmark suite ${suite.name}`);
            const cachedPath = `${config.outputDir}/${app}/src/trans`;
            let topFunctionName = "<none>";

            let invalidCache = false;
            if (disableCaching) {
                this.log(`Caching is disabled, loading full benchmark for app ${app}...`);
                topFunctionName = LiteBenchmarkLoader.load(suite, app);
                if (topFunctionName === "<none>") {
                    this.log(`Could not load app ${app}, skipping...`);
                    continue;
                }
                invalidCache = true;
                this.log(`Loaded full benchmark for app ${app} with top function ${topFunctionName}`);
            }
            else {
                this.log(`Trying to load cached app ${app} from ${cachedPath}...`);
                topFunctionName = LiteBenchmarkLoader.load(suite, app, cachedPath);

                if (topFunctionName === "<none>") {
                    this.log(`Could not load cached app ${app}, loading full benchmark instead`);
                    invalidCache = true;

                    this.log(`Loading full benchmark for app ${app}...`);
                    topFunctionName = LiteBenchmarkLoader.load(suite, app);
                    if (topFunctionName === "<none>") {
                        this.log(`Could not load app ${app}, skipping...`);
                        return false;
                    }
                    this.log(`Loaded full benchmark for app ${app} with top function ${topFunctionName}`);
                }
                else {
                    this.log(`Loaded cached app ${app} with top function ${topFunctionName}`);
                }
            }

            try {
                if (invalidCache) {
                    const success = this.runPrologue(app, topFunctionName, config);
                    if (!success) {
                        this.log(`Code transformation flow failed for app ${app}`);
                        this.log("-".repeat(58));
                        continue;
                    }
                }
                this.runScript(app, topFunctionName, config);

                this.log(`Finished running ${this.getScriptName()} flows for app ${app} of benchmark suite ${suite.name}`);

            } catch (e) {
                this.log((e instanceof Error) ? e.message : String(e));
                this.log(`${chalk.red("Error: ")} exception while running ${this.getScriptName()} for app ${app} of benchmark suite ${suite.name}`);
            }
            this.log("-".repeat(this.lineLength));
            if (apps.length > 1) {
                Clava.popAst();
            }
        }
        if (apps.length > 1) {
            this.log(`Finished running ${this.getScriptName()} for ${apps.length} apps from benchmark suite ${suite.name}`);
        }
        return true;
    }

    protected log(msg: string): void {
        const header = chalk.yellowBright("SuiteRunner");
        console.log(`[${header}] ${msg}`);
    }

    protected abstract getScriptName(): string;

    protected abstract runPrologue(app: string, topFunctionName: string, config: Record<string, any>): boolean;

    protected abstract runScript(app: string, topFunctionName: string, config: Record<string, any>): void;
}