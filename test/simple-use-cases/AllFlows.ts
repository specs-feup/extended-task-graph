import chalk from "chalk";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";

const api = new ExtendedTaskGraphAPI("edge_detect", "output/use-cases", "edgedetect-allflows");

try {
    api.runCodeTransformationFlow(true, true, true);

} catch (e) {
    console.error(e);
    console.log(chalk.green("Test failed") + ": TransFlow failed");
}
console.log("TransFlow succeeded, moving on to EtgFlow");

try {
    const etg = api.runTaskGraphGenerationFlow(true, true);
    if (etg == null) {
        console.log(chalk.red("Test failed") + ": EtgFlow failed");
    } else {
        console.log(chalk.green("Test succeeded") + ": both TransFlow and EtgFlow finished correctly");
    }
} catch (e) {
    console.error(e);
}