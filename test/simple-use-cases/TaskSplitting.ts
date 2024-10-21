import chalk from "chalk";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";
import { TaskGraph } from "../../src/taskgraph/TaskGraph.js";
import { RegularTask } from "../../src/taskgraph/tasks/RegularTask.js";
import { Loop } from "@specs-feup/clava/api/Joinpoints.js";
import { TaskSplitter } from "../../src/taskgraph/TaskSplitter.js";

const api = new ExtendedTaskGraphAPI("edge_detect", "output/apps", "edgedetect-split");

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

    const task = etg.getTaskByName("convolve2d_rep2")! as RegularTask;
    let loop = null;

    let foundFirst = false;
    for (const stmt of task.getFunction().body.stmts) {
        if (stmt instanceof Loop && !foundFirst) {
            foundFirst = true;
        }
        else if (stmt instanceof Loop && foundFirst) {
            loop = stmt;
            break;
        }
    }

    const splitter = new TaskSplitter();
    const [oldTask, newTask] = splitter.splitTask(etg, task, loop!);

    if (newTask != null) {
        console.log(oldTask.getName() + ", " + oldTask.getId());
        console.log(newTask.getName() + ", " + newTask.getId());
        console.log("--------------------------");
        console.log(oldTask.getFunction().code);
        console.log(newTask.getFunction().code);

        api.dumpTaskGraph(etg, "../edgedetect-split-result");

        console.log(chalk.green("Test passed") + ": Merging succeeded");
    } else {
        console.log(chalk.red("Test failed") + ": Merging failed");
    }
}