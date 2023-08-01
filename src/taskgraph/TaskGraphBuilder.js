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
        // if task was called by another, add the argument names
        // as alternate names for the task param data
        if (call != null) {
            task.updateWithAlternateNames(call);
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
            const childData = child.getParamData();

            // Extremely mindbending code to handle the mismatch between the name
            // of the data when in the caller and in the callee
            let rank = 1;
            for (const data of childData) {
                const dataAlt = data.getAlternateName();

                // create edge from source to current task
                // we need to use the alternate name for this, because it's the name
                // the parent task knows
                const parentData = dataMap.get(dataAlt);
                const lastUsedTask = lastUsed.get(dataAlt);
                taskGraph.addCommunication(lastUsedTask, child, parentData, rank);

                // now inside the task itself, we check if the data is written to,
                // and if it is, set this task as the last one to use that data    
                if (data.isWritten()) {
                    lastUsed.set(dataAlt, child);
                }

                // finally, we increment the rank. It is very important
                rank++;
            }
        }
    }
}