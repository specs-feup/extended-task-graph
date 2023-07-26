"use strict";

laraImport("weaver.Query");
laraImport("UPTStage");
laraImport("taskgraph/TaskGraph");
laraImport("taskgraph/Task");
laraImport("taskgraph/Communication");
laraImport("taskgraph/TaskGraphDumper");

class TaskGraphBuilder {

    constructor() { }

    build(topFunction) {
        const taskGraph = new TaskGraph(topFunction);

        this.#buildLevel(taskGraph, topFunction, null);

        return taskGraph;
    }

    #buildLevel(taskGraph, fun, parent) {
        const task = new Task(fun, parent, "REGULAR");
        taskGraph.addTask(task);

        for (const call of Query.searchFrom(fun, "call")) {
            const callee = call.function;

            // Is of type "REGULAR", handle recursively
            if (ClavaUtils.functionHasImplementation(callee)) {
                this.#buildLevel(taskGraph, callee, task);
            }
            // Is of type "EXTERNAL", create it on the spot
            else if (!ExternalFunctionsMatcher.isValidExternal(callee)) {
                const externalTask = new Task(callee, task, "EXTERNAL");
                taskGraph.addTask(externalTask);
            }
            // Should only happen for inlinable functions (e.g., math.h)
            else {
                println("Found an inlinable function: " + callee.signature);
            }

        }
    }

}