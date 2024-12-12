import chalk from "chalk";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";
import { RegularTask } from "../../src/taskgraph/tasks/RegularTask.js";
import { GenFlowConfig } from "../../src/api/GenFlowConfig.js";
import { Cluster } from "../../src/taskgraph/Cluster.js";
import { ClusterDotConverter } from "../../src/taskgraph/dotfile/ClusterDotConverter.js";
import Io from "@specs-feup/lara/api/lara/Io.js";

try {
    const config = new GenFlowConfig();
    config.gatherMetrics = false;

    const api = new ExtendedTaskGraphAPI("edge_detect", "output/use-cases", "edgedetect-clustering");
    const etg = api.runTaskGraphGenerationFlow(config);

    if (etg == null) {
        console.log(chalk.red("Test failed") + ": TaskGraph is null");
        process.exit(1);
    }

    const nTasks = etg.getTasks().length;
    const nEdges = etg.getCommunications().length;
    console.log(`ETG has ${nTasks} tasks and ${nEdges} edges`);

    const t1 = etg.getTaskByName("convolve2d_rep2")! as RegularTask;
    const t2 = etg.getTaskByName("combthreshold")! as RegularTask;

    const cluster = new Cluster("test-cluster");
    cluster.addTask(t1);
    cluster.addTask(t2);

    const inOuts = cluster.getInOuts();
    console.log(inOuts);

    const cluster2dot = new ClusterDotConverter();
    const dot = cluster2dot.convert(cluster);

    Io.writeFile("output/use-cases/edgedetect-clustering/test-cluster.dot", dot);
    console.log("Check the output in output/use-cases/edgedetect-clustering/test-cluster.dot");
    console.log(chalk.green("Test passed") + ": Merging succeeded");
}
catch (e) {
    console.log(chalk.red("Test failed") + ": " + e);
    process.exit(1);
}