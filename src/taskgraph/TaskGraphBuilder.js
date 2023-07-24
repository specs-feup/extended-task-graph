"use strict";

laraImport("UPTStage");
laraImport("taskgraph/TaskGraph");
laraImport("taskgraph/Task");
laraImport("taskgraph/Communication");
laraImport("taskgraph/TaskGraphDumper");

class TaskGraphBuilder extends UPTStage {

    constructor(topFunction, outputDir, appName) {
        super("HPFlow-TaskGraphBuilder", topFunction, outputDir, appName);
    }

    buildTaskGraph() {
        const taskGraph = new TaskGraph(this.getTopFunction());
        this.log("Successfully built the task graph");
        return taskGraph;
    }

    dumpTaskGraph(taskGraph) {
        const dumper = new TaskGraphDumper();
        const dot = dumper.dump(taskGraph);
        this.saveToFile(dot, "taskgraph.dot");
        this.log("Dumped task graph to file taskgraph.dot");
    }
}