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

        const topTask = this.#buildLevel(taskGraph, topFunction, null);

        for (const data of topTask.getReferencedData()) {
            taskGraph.addCommunication(taskGraph.getSource(), topTask, data);
        }
        for (const data of topTask.getDataWritten()) {
            taskGraph.addCommunication(topTask, taskGraph.getSink(), data);
        }

        return taskGraph;
    }

    #buildLevel(taskGraph, fun, parent) {
        const task = new Task(fun, parent, "REGULAR");
        taskGraph.addTask(task);

        const childTasks = [];

        for (const call of Query.searchFrom(fun, "call")) {
            const callee = call.function;

            // Is of type "REGULAR", handle recursively
            if (ClavaUtils.functionHasImplementation(callee)) {
                const regularTask = this.#buildLevel(taskGraph, callee, task);
                task.addHierarchicalChild(regularTask);
                childTasks.push(regularTask);
            }
            // Is of type "EXTERNAL", create it on the spot
            else if (!ExternalFunctionsMatcher.isValidExternal(callee)) {
                const externalTask = new Task(callee, task, "EXTERNAL");
                taskGraph.addTask(externalTask);
                task.addHierarchicalChild(externalTask);
                childTasks.push(externalTask);
            }
            // Should only happen for inlinable functions (e.g., math.h)
            else {
                println("Found an inlinable function: " + callee.signature);
            }
        }
        this.#buildCommunications(taskGraph, task, childTasks);

        this.#updateParentReadWrites(task, childTasks);

        return task;
    }

    #buildCommunications(taskGraph, parent, children) {
        const parentData = parent.getData();
        const lastUsed = {};
        for (const data of parentData) {
            lastUsed[data.getName()] = parent;
        }

        for (const child of children) {
            const childData = child.getData();
            for (const data of childData) {
                const name = data.getName();
                const lastUsedTask = lastUsed[name];
                if (lastUsedTask != null) {
                    taskGraph.addCommunication(lastUsedTask, child, data);
                }
            }
            const dataWritten = child.getDataWritten();
            for (const data of dataWritten) {
                lastUsed[data.getName()] = child;
            }
        }
    }

    #updateParentReadWrites(parent, children) {
        const dataWrittenInChildren = [];

        for (const child of children) {
            for (const data of child.getDataWritten()) {
                dataWrittenInChildren.push(data);
            }
        }

        for (const parentData of parent.getReferencedData()) {
            for (const childData of dataWrittenInChildren) {
                if (parentData.getName() === childData.getName()) {
                    parentData.setWritten();
                }
            }
        }
    }
}