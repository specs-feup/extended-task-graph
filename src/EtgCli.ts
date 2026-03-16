#!/usr/bin/env node

import { spawn } from 'child_process';
import chalk from 'chalk';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

const optionDefinitions = [
    { name: 'input', alias: 'i', type: String, defaultOption: true, description: 'Input source folder.' },
    { name: 'std', type: String, description: 'C/C++ standard.' },
    // Primary Flows
    { name: 'transform', type: Boolean, description: 'Run transformation flow.' },
    { name: 'generate', type: Boolean, description: 'Run generation flow.' },
    { name: 'all', type: Boolean, description: 'Run all flows.' },
    // Transform Sub-options
    { name: 'no-ast', type: Boolean, description: 'Disable AST dump.' },
    { name: 'no-cg', type: Boolean, description: 'Disable Call Graph dump.' },
    { name: 'only-ast', type: Boolean, description: 'Only dump AST (disables others).' },
    { name: 'only-cg', type: Boolean, description: 'Only dump Call Graph (disables others).' },
    // Generate Sub-options
    { name: 'no-metrics', type: Boolean, description: 'Disable metrics calculation.' },
    { name: 'help', alias: 'h', type: Boolean, description: 'Display help.' }
];

function runClavaWithContext(): void {
    let options: any;
    try {
        options = commandLineArgs(optionDefinitions);
    } catch (err: any) {
        console.error(chalk.red(`Argument Error: ${err.message}`));
        process.exit(1);
    }

    if (options.help || !options.input) {
        const sections = [
            { header: 'etg', content: 'Extended Task Graph generator.' },
            { header: 'Synopsis', content: '$ etg <input_folder> [options]' },
            { header: 'Options', optionList: optionDefinitions }
        ];
        console.log(commandLineUsage(sections));
        process.exit(options.help ? 0 : 1);
    }

    // Configuration Logic
    const isTransform = !!(options.all || options.transform || options['only-ast'] || options['only-cg']);
    const isGenerate = !!(options.all || options.generate);

    const context = {
        inputFolder: options.input,
        flows: {
            transform: {
                enabled: isTransform,
                dumpAst: options['only-ast'] ? true : (options['only-cg'] ? false : !options['no-ast']),
                dumpCg: options['only-cg'] ? true : (options['only-ast'] ? false : !options['no-cg'])
            },
            generate: {
                enabled: isGenerate,
                calculateMetrics: !options['no-metrics']
            }
        }
    };

    const childEnv = {
        ...process.env,
        CLAVA_WRAPPER_ARGS: JSON.stringify(context)
    };

    const clavaArgs = ["clava", "classic", "dist/src/EtgEntrypoint.js", "-p", options.input, "-ncg"];
    if (options.std) clavaArgs.push("-std", options.std);

    const child = spawn("npx", clavaArgs, { stdio: 'inherit', shell: true, env: childEnv });
    child.on('close', (code) => process.exit(code ?? 0));
}

runClavaWithContext();