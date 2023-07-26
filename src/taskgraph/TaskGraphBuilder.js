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
        const taskGraph = new TaskGraph();

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
                const regularTask = this.#buildLevel(taskGraph, callee, task);
                task.addHierarchicalChild(regularTask);
            }
            // Is of type "EXTERNAL", create it on the spot
            else if (!ExternalFunctionsMatcher.isValidExternal(callee)) {
                const externalTask = new Task(callee, task, "EXTERNAL");
                taskGraph.addTask(externalTask);
                task.addHierarchicalChild(externalTask);
            }
            // Should only happen for inlinable functions (e.g., math.h)
            else {
                println("Found an inlinable function: " + callee.signature);
            }
        }
        return task;
    }

}