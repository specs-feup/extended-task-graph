import chalk from "chalk";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";
import { TaskGraph } from "../../src/taskgraph/TaskGraph.js";

const api = new ExtendedTaskGraphAPI("edge_detect", "output/use-cases", "edgedetect-etg");

let etg: TaskGraph | null = null;
try {
    const generateEtg = true;
    const gatherMetrics = false;

    etg = api.runTaskGraphGenerationFlow(generateEtg, gatherMetrics);
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
