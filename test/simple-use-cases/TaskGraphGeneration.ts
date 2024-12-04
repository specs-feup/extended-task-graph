import chalk from "chalk";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";
import { TaskGraph } from "../../src/taskgraph/TaskGraph.js";
import { GenFlowConfig } from "../../src/api/GenFlowConfig.js";

const api = new ExtendedTaskGraphAPI("edge_detect", "output/use-cases", "edgedetect-etg");

let etg: TaskGraph | null = null;
try {
    const config = new GenFlowConfig();
    config.dumpGraph = true;
    config.gatherMetrics = true;

    etg = api.runTaskGraphGenerationFlow(config);
} catch (e) {
    console.error(e);
}

if (etg == null) {
    console.log(chalk.red("Test failed") + ": ETG construction failed");
} else {
    console.log(chalk.green("Test passed") + ": ETG construction succeeded");

    // do whatever you want with the graph...
    const nTasks = etg.getTasks().length;
    const nEdges = etg.getCommunications().length;
    console.log(`ETG has ${nTasks} tasks and ${nEdges} edges`);
}
