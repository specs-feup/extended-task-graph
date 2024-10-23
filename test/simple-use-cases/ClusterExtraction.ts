import chalk from "chalk";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";
import { TaskGraph } from "../../src/taskgraph/TaskGraph.js";
import { ClusterExtractor } from "../../src/taskgraph/transforms/ClusterExtractor.js";
import { RegularTask } from "../../src/taskgraph/tasks/RegularTask.js";

const api = new ExtendedTaskGraphAPI("start", "output/use-cases", "cluster-scenario");

let etg: TaskGraph | null = null;
try {
    const generateEtg = true;
    const gatherMetrics = false;

    api.runCodeTransformationFlow(true, true, true);
    etg = api.runTaskGraphGenerationFlow(generateEtg, gatherMetrics);
}
catch (e) {
    console.error(e);
}

if (etg == null) {
    console.log(chalk.red("Test failed") + ": ETG construction failed");
}
else {
    const task = etg.getTaskByName("fizzbuzz")! as RegularTask;

    const ext = new ClusterExtractor();
    ext.extractCluster(task);

    api.generateSourceCode("clustered");

    console.log(chalk.green("Test passed") + ": Cluster extraction succeeded");
}