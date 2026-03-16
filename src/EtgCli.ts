#!/usr/bin/env node
import { spawn } from 'child_process';
import chalk from 'chalk';
import commandLineArgs, { CommandLineOptions } from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

export type CliContext = {
    inputFolder: string;
    outputFolder: string;
    appName: string;
    topFunction: string;
    standard?: string;
    flows: {
        transform: {
            enabled: boolean;
            dumpAst: boolean;
            dumpCg: boolean;
        };
        generate: {
            enabled: boolean;
            calculateMetrics: boolean;
        };
    };
};

const optionDefinitions = [
    { name: 'input', type: String, defaultOption: true, description: 'Input folder or file containing the source code to analyze.' },
    { name: 'output', alias: 'o', type: String, description: 'Output folder     (default: "output").' },
    { name: 'app-name', alias: 'a', type: String, description: 'Application name  (default: "default_app_name").' },
    { name: 'top-function', alias: 't', type: String, description: 'Top function name (default: "main").' },
    { name: 'standard', alias: 's', type: String, description: 'C/C++ standard    (default: c11, c++11)' },
    { name: 'help', alias: 'h', type: Boolean, description: 'Display this help guide.' },

    // Primary Flows
    { name: 'transform', type: Boolean, group: 'main', description: 'Run the code transformation flow.' },
    { name: 'generate', type: Boolean, group: 'main', description: 'Run the ETG generation flow.' },
    { name: 'all', type: Boolean, group: 'main', description: 'Run all flows.' },

    // Transform Sub-options
    { name: 'no-ast', type: Boolean, group: 'transform', description: 'Disable AST dump.' },
    { name: 'no-cg', type: Boolean, group: 'transform', description: 'Disable Call Graph dump.' },
    { name: 'only-ast', type: Boolean, group: 'transform', description: 'Only dump AST.' },
    { name: 'only-cg', type: Boolean, group: 'transform', description: 'Only dump Call Graph.' },

    // Generate Sub-options
    { name: 'no-metrics', type: Boolean, group: 'generate', description: 'Disable ETG metrics reporting.' }
];

const usageSections = [
    {
        header: 'etg',
        content: 'Extended Task Graph generator.'
    },
    {
        header: 'Synopsis',
        content: '$ etg <input_folder_or_file> [options]'
    },
    {
        header: 'Global Options',
        optionList: optionDefinitions,
        group: '_none' // Includes input, std, help
    },
    {
        header: 'Flow Selection',
        optionList: optionDefinitions,
        group: 'main'
    },
    {
        header: 'Code Transformation Flow Sub-options',
        optionList: optionDefinitions,
        group: 'transform'
    },
    {
        header: 'ETG Generation Flow Sub-options',
        optionList: optionDefinitions,
        group: 'generate'
    }
];

function getCliContext(): CliContext {
    let options: CommandLineOptions = {};
    try {
        options = commandLineArgs(optionDefinitions);
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error(chalk.red(`Argument Error: ${err.message}`));
        } else {
            console.error(chalk.red('An unknown error occurred while parsing arguments.'));
        }
        process.exit(1);
    }

    const actualOptions = options._all;

    if (actualOptions.help || !actualOptions.input) {
        console.log(commandLineUsage(usageSections));
        process.exit(actualOptions.help ? 0 : 1);
    }

    const isTransform = !!(actualOptions.all || actualOptions.transform || actualOptions['only-ast'] || actualOptions['only-cg']);
    const isGenerate = !!(actualOptions.all || actualOptions.generate);

    const context: CliContext = {
        inputFolder: actualOptions.input,
        outputFolder: actualOptions.output || "output",
        appName: actualOptions['app-name'] || "default_app_name",
        topFunction: actualOptions['top-function'] || "main",
        standard: actualOptions.standard,
        flows: {
            transform: {
                enabled: isTransform,
                dumpAst: actualOptions['only-ast'] ? true : (actualOptions['only-cg'] ? false : !actualOptions['no-ast']),
                dumpCg: actualOptions['only-cg'] ? true : (actualOptions['only-ast'] ? false : !actualOptions['no-cg'])
            },
            generate: {
                enabled: isGenerate,
                calculateMetrics: !actualOptions['no-metrics']
            }
        }
    };
    return context;
}

function runClava(context: CliContext): void {
    const childEnv = {
        ...process.env,
        CLAVA_WRAPPER_ARGS: JSON.stringify(context)
    };

    const require = createRequire(import.meta.url);
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const entryPoint = join(__dirname, "EtgEntrypoint.js");
    const clavaRoot = dirname(require.resolve('@specs-feup/clava/package.json'));
    const clavaBin = join(clavaRoot, 'code', 'index.js');

    const clavaArgs = [clavaBin, "classic", entryPoint, "-p", context.inputFolder, "-ncg"];
    if (context.standard) {
        clavaArgs.push("-std", context.standard);
    }

    const child = spawn(process.execPath, clavaArgs, {
        stdio: 'inherit',
        shell: true,
        env: childEnv
    });

    child.on('error', (err) => {
        console.error(chalk.red(`Failed to start Clava: ${err.message}`));
        process.exit(1);
    });

    child.on('close', (code: number | null) => {
        process.exit(code ?? 0);
    });
}

const context = getCliContext();
runClava(context);
