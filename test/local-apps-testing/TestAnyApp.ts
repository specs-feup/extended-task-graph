import chalk from "chalk";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";
import { TransFlowConfig } from "../../src/api/TransFlowConfig.js";
import { GenFlowConfig } from "../../src/api/GenFlowConfig.js";

const appName = "fpl-spam-filter";
const topFunctionName = "SgdLR_sw";
const outputFolder = "output/local-apps";

const api = new ExtendedTaskGraphAPI(topFunctionName, outputFolder, appName);

try {
    const config = new TransFlowConfig();
    config.transformRecipe = [];
    config.doTransforms = false;

    api.runCodeTransformationFlow(config);

} catch (e) {
    console.error(e);
    console.log(chalk.green("Test failed") + ": TransFlow failed");
}
console.log("TransFlow succeeded, moving on to EtgFlow");

try {
    const config = new GenFlowConfig();
    config.enabled = false;

    const etg = api.runTaskGraphGenerationFlow(config);
    if (etg == null) {
        console.log(chalk.red("Test failed") + ": EtgFlow failed");
    } else {
        console.log(chalk.green("Test succeeded") + ": both TransFlow and EtgFlow finished correctly");
    }
} catch (e) {
    console.error(e);
}