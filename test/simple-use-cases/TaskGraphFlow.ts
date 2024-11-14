import chalk from "chalk";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";
import { TaskGraph } from "../../src/taskgraph/TaskGraph.js";

const api = new ExtendedTaskGraphAPI("edge_detect", "output/use-cases", "edgedetect-etgflow");

let etg: TaskGraph | null = null;
try {
    etg = api.runTaskGraphGenerationFlow();
} catch (e) {
    console.error(e);
}

if (etg == null) {
    console.log(chalk.red("Test failed") + ": ETG flow failed");
} else {
    console.log(chalk.green("Test passed") + ": ETG flow succeeded");
}
