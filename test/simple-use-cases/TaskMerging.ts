import chalk from "chalk";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";
import { TaskGraph } from "../../src/taskgraph/TaskGraph.js";
import { RegularTask } from "../../src/taskgraph/tasks/RegularTask.js";
import { TaskMerger } from "../../src/taskgraph/transforms/TaskMerger.js";
import { GenFlowConfig } from "../../src/api/TaskGraphGenerationFlow.js";

const api = new ExtendedTaskGraphAPI("edge_detect", "output/use-cases", "edgedetect-merge");

let etg: TaskGraph | null = null;
try {
    const config = new GenFlowConfig();
    config.gatherMetrics = false;

    api.runCodeTransformationFlow();
    etg = api.runTaskGraphGenerationFlow(config);
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
        api.dumpTaskGraph(etg, "merged");
        api.generateSourceCode("merged");

        console.log(chalk.green("Test passed") + ": Merging succeeded");
    } else {
        console.log(chalk.red("Test failed") + ": Merging failed");
    }
}