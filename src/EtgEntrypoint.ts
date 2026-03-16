import chalk from "chalk";
import { ExtendedTaskGraphAPI } from "./api/ExtendedTaskGraphAPI.js";
import { CliContext } from "./EtgCli.js";
import { TransFlowConfig } from "./api/TransFlowConfig.js";
import { GenFlowConfig } from "./api/GenFlowConfig.js";

export class EtgEntrypoint extends ExtendedTaskGraphAPI {
    constructor(topFunctionName: string = "main", outputDir: string = "output", appName: string = "default_app_name") {
        super(topFunctionName, outputDir, appName, "CLI");
    }
}

function main() {
    const rawArgs = process.env.CLAVA_WRAPPER_ARGS;
    if (!rawArgs) {
        console.error(chalk.red('No arguments provided to the ETG entry point.'));
        process.exit(1);
    }
    const args = JSON.parse(rawArgs) as CliContext;
    const entrypoint = new EtgEntrypoint(args.topFunction, args.outputFolder, args.appName);

    if (args.flows.transform.enabled) {
        const transConfig = new TransFlowConfig();
        transConfig.dumpAST = args.flows.transform.dumpAst;
        transConfig.dumpCallGraph = args.flows.transform.dumpCg;

        entrypoint.runCodeTransformationFlow(transConfig);
    }
    if (args.flows.generate.enabled) {
        const genConfig = new GenFlowConfig();
        genConfig.gatherMetrics = args.flows.generate.calculateMetrics;

        entrypoint.runTaskGraphGenerationFlow(genConfig);
    }
}

main();