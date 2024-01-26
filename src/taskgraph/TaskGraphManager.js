"use strict";

laraImport("UPTStage");
laraImport("taskgraph/TaskGraph");
laraImport("taskgraph/TaskGraphBuilder");
laraImport("taskgraph/TaskGraphDumper");

class TaskGraphManager extends UPTStage {

    constructor(topFunction, outputDir, appName) {
        super("TGGFlow-TaskGraphManager", topFunction, outputDir, appName);
    }

    buildTaskGraph() {
        const tgBuilder = new TaskGraphBuilder();
        const taskGraph = tgBuilder.build(this.getTopFunction());

        if (taskGraph == null) {
            this.log("Failed to build the task graph");
            return null;
        }
        else {
            this.log("Successfully built the task graph");
            return taskGraph;
        }
    }

    dumpTaskGraph(taskGraph) {
        const dumper = new TaskGraphDumper();
        const dotVerbose = dumper.dump(taskGraph);
        const dotMinimal = dumper.dumpMinimal(taskGraph);

        const fname1 = this.saveToFile(dotVerbose, "taskgraph.dot");
        const fname2 = this.saveToFile(dotMinimal, "taskgraph_min.dot");

        this.log(`Dumped task graph to files "${fname1}" and "${fname2}"`);
    }
}