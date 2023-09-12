"use strict";

laraImport("UPTStage");
laraImport("taskgraph/TaskGraph");
laraImport("taskgraph/TaskGraphBuilder");
laraImport("taskgraph/TaskGraphDumper");
laraImport("taskgraph/TaskGraphMetricsAggregator");

class TaskGraphManager extends UPTStage {

    constructor(topFunction, outputDir, appName) {
        super("HPFlow-TaskGraphManager", topFunction, outputDir, appName);
    }

    buildTaskGraph() {
        const tgBuilder = new TaskGraphBuilder();
        const taskGraph = tgBuilder.build(this.getTopFunction());
        this.log("Successfully built the task graph");
        return taskGraph;
    }

    dumpTaskGraph(taskGraph) {
        const dumper = new TaskGraphDumper();
        const dotVerbose = dumper.dump(taskGraph);
        const dotMinimal = dumper.dumpMinimal(taskGraph);

        const fname1 = this.saveToFile(dotVerbose, "taskgraph.dot");
        const fname2 = this.saveToFile(dotMinimal, "taskgraph_min.dot");

        this.log(`Dumped task graph to files "${fname1}" and "${fname2}"`);
    }

    saveMetrics(taskGraph) {
        const agg = new TaskGraphMetricsAggregator(this.getAppName(), taskGraph);
        agg.updateMetrics();
        const jsonMetrics = agg.getMetricsAsJson();

        const fname = this.saveToFile(jsonMetrics, "metrics.json");
        this.log(`Saved metrics to file "${fname}"`);
    }
}