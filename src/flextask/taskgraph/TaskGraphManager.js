"use strict";

laraImport("flextask/AStage");
laraImport("flextask/taskgraph/TaskGraph");
laraImport("flextask/taskgraph/TaskGraphBuilder");
laraImport("flextask/taskgraph/TaskGraphDumper");

class TaskGraphManager extends AStage {

    constructor(topFunction, outputDir, appName) {
        super("TGGFlow-TaskGraphManager", topFunction, outputDir, appName);
    }

    buildTaskGraph() {
        const tgBuilder = new TaskGraphBuilder();
        const startingPoint = this.getTopFunctionJoinPoint();

        this.log(`Task graph root function defined as "${startingPoint.name}"`);
        const taskGraph = tgBuilder.build(startingPoint);

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

        this.log(`Dumped full task graph to "${fname1}"`);
        this.log(`Dumped mini task graph to "${fname2}"`);
    }
}