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
        const dot = dumper.dump(taskGraph);
        this.saveToFile(dot, "taskgraph.dot");
        this.log("Dumped task graph to file taskgraph.dot");
    }

    saveMetrics(taskGraph) {
        const agg = new TaskGraphMetricsAggregator(this.getAppName(), taskGraph);
        agg.updateMetrics();
        const jsonMetrics = agg.getMetricsAsJson();

        this.saveToFile(jsonMetrics, "metrics.json");
        this.log("Saved metrics to file metrics.json");
    }
}