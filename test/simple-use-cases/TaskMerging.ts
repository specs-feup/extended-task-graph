import chalk from "chalk";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";
import { TaskGraph } from "../../src/taskgraph/TaskGraph.js";
import { RegularTask } from "../../src/taskgraph/tasks/RegularTask.js";
import { TaskMerger } from "../../src/taskgraph/TaskMerger.js";

const api = new ExtendedTaskGraphAPI("edge_detect", "output/apps", "edgedetect-merge");

let etg: TaskGraph | null = null;
try {
    const generateEtg = true;
    const gatherMetrics = false;

    api.runCodeTransformationFlow(true, true, true);
    etg = api.runTaskGraphGenerationFlow(generateEtg, gatherMetrics);
} catch (e) {
    console.error(e);
}

if (etg == null) {
    console.log(chalk.red("Test failed") + ": ETG construction failed");
} else {
    const nTasks = etg.getTasks().length;
    const nEdges = etg.getCommunications().length;
    console.log(`ETG has ${nTasks} tasks and ${nEdges} edges`);

    const t1 = etg.getTaskByName("convolve2d_rep2")! as RegularTask;
    const t2 = etg.getTaskByName("combthreshold")! as RegularTask;

    const merger = new TaskMerger();
    const merged = merger.mergeTasks(etg, t1, t2);

    if (merged != null) {
        console.log(merged.getName());
        console.log(merged.getId());
        console.log(merged.getFunction().code);

        api.dumpTaskGraph(etg, "../edgedetect-merge-result");

        console.log(chalk.green("Test passed") + ": Merging succeeded");
    } else {
        console.log(chalk.red("Test failed") + ": Merging failed");
    }
}