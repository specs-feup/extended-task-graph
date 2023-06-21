"use strict";

laraImport("UPTStage");
laraImport("taskgraph/TaskGraph");
laraImport("taskgraph/Task");
laraImport("taskgraph/Communication");

class TaskGraphBuilder extends UPTStage {
    #topFunction;

    constructor(topFunction, outputDir, appName) {
        super("HPFlow-TaskGraphBuilder", outputDir, appName);
        this.#topFunction = topFunction;
    }

    buildTaskGraph() {
        const tg = new TaskGraph();

        const allFunctions = ClavaUtils.getAllUniqueFunctions(this.#topFunction);
        const tasks = [];
        for (const fun of allFunctions) {
            const task = new Task(fun);
            tasks.push(task);
        }
        tg.addTasks(tasks);

        this.log("Finished building the task graph");
        return tg;
    }

    dumpTaskGraph(tg) {
        const dot = tg.toDot();
        this.saveToFile(dot, "taskgraph.dot");
        this.log("Dumped task graph to file taskgraph.dot");
    }
}