"use strict";

laraImport("UPTStage");
laraImport("taskgraph/TaskGraph");

class TaskGraphBuilder extends UPTStage {
    constructor(outputDir, appName) {
        super("HPFlow-TaskGraphBuilder", outputDir, appName);
    }

    buildTaskGraph() {
        const tg = new TaskGraph();

        this.log("Finished building the task graph");
        return tg;
    }
}