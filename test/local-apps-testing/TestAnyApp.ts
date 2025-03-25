import chalk from "chalk";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";
import { TransFlowConfig } from "../../src/api/TransFlowConfig.js";
import { GenFlowConfig } from "../../src/api/GenFlowConfig.js";
import { TaskGraph } from "../../src/taskgraph/TaskGraph.js";

export function testAnyApp(appName: string, topFunctionName: string, outputFolder: string, transConfig?: TransFlowConfig, genConfig?: GenFlowConfig): boolean {
    const api = new ExtendedTaskGraphAPI(topFunctionName, outputFolder, appName);

    try {
        if (transConfig == null) {
            api.runCodeTransformationFlow();
        }
        else {
            api.runCodeTransformationFlow(transConfig);
        }
    } catch (e) {
        console.error(e);
        console.log(chalk.green("Test failed") + ": TransFlow failed");
        return false;
    }
    console.log("TransFlow succeeded, moving on to EtgFlow");

    try {
        let etg: TaskGraph | null;
        if (genConfig == null) {
            etg = api.runTaskGraphGenerationFlow();
        }
        else if (genConfig.enabled) {
            etg = api.runTaskGraphGenerationFlow(genConfig);
        }
        else {
            console.log(chalk.yellow("Skipping EtgFlow"));
            return true;
        }

        if (etg == null) {
            console.log(chalk.red("Test failed") + ": EtgFlow failed");
        } else {
            console.log(chalk.green("Test succeeded") + ": both TransFlow and EtgFlow finished correctly");
        }
    } catch (e) {
        console.error(e);
        return false;
    }
    return true;
}
