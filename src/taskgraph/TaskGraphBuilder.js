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

        const topTask = this.#buildLevel(taskGraph, topFunction, null, null);
        let rank = 1;

        for (const data of topTask.getReferencedData()) {
            taskGraph.addCommunication(taskGraph.getSource(), topTask, data, rank);
            rank++;
        }

        rank = 1;
        for (const data of topTask.getDataWritten()) {
            taskGraph.addCommunication(topTask, taskGraph.getSink(), data, rank);
            rank++;
        }

        return taskGraph;
    }

    #buildLevel(taskGraph, fun, parent, call) {
        const task = new Task(fun, parent, "REGULAR");
        if (call != null) {
            task.setCall(call);
        }
        taskGraph.addTask(task);

        const childTasks = [];

        for (const call of Query.searchFrom(fun, "call")) {
            const callee = call.function;

            // Is of type "REGULAR", handle recursively
            if (ClavaUtils.functionHasImplementation(callee)) {
                const regularTask = this.#buildLevel(taskGraph, callee, task, call);
                task.addHierarchicalChild(regularTask);
                childTasks.push(regularTask);
            }
            // Is of type "EXTERNAL", create it on the spot
            else if (!ExternalFunctionsMatcher.isValidExternal(callee)) {
                const externalTask = new Task(callee, task, "EXTERNAL");
                externalTask.setCall(call);
                taskGraph.addTask(externalTask);
                task.addHierarchicalChild(externalTask);
                childTasks.push(externalTask);
            }
            // Should only happen for inlinable functions (e.g., math.h)
            else {
                println("Found an inlinable function: " + callee.signature);
                taskGraph.addInlinable(call);
            }
        }

        // Add communications
        this.#addCommunication(taskGraph, task, childTasks);
        return task;
    }

    #addCommunication(taskGraph, parent, children) {
        const parentData = parent.getData();
        const lastUsed = new Map();
        const dataMap = new Map();

        for (const data of parentData) {
            lastUsed.set(data.getName(), parent);
            dataMap.set(data.getName(), data);
        }

        for (const child of children) {
            const childArgs = child.getCallArgs();
            const childData = child.getParamData();

            // Extremely mindbending code to handle the mismatch between the name
            // of the data when in the caller and in the callee
            for (let i = 0; i < childArgs.length; i++) {
                const arg = childArgs[i];
                const parentData = dataMap.get(arg);
                const lastUsedTask = lastUsed.get(arg);
                taskGraph.addCommunication(lastUsedTask, child, parentData, i + 1);

                const dataMatchingArg = childData[i];
                if (dataMatchingArg.isWritten()) {
                    lastUsed.set(arg, child);
                }
            }
        }
    }
}