"use strict";

laraImport("weaver.Query");
laraImport("clava.code.LoopCharacterizer");
laraImport("flextask/AStage");
laraImport("flextask/taskgraph/TaskGraph");
laraImport("flextask/taskgraph/Task");
laraImport("flextask/taskgraph/Communication");
laraImport("flextask/taskgraph/TaskGraphDumper");

class TaskGraphBuilder {
    #lastUsedGlobal = new Map();

    constructor() { }

    build(topFunctionJoinPoint) {
        const taskGraph = new TaskGraph();

        this.#populateGlobalMap(taskGraph);

        try {
            const topTask = this.#buildLevel(taskGraph, topFunctionJoinPoint, null, null);

            // main_begin and main_end are special, and outside of the hierarchy
            let rank = 1;
            for (const data of topTask.getReferencedData()) {
                taskGraph.addCommunication(taskGraph.getSource(), topTask, data, data, rank);
                rank++;
            }
            rank = 1;
            for (const data of topTask.getDataWritten()) {
                taskGraph.addCommunication(topTask, taskGraph.getSink(), data, data, rank);
                rank++;
            }

        } catch (e) {
            println("[TaskGraphBuilder] CATASTROPHIC ERROR: " + e);
            return null;
        }
        return taskGraph;
    }

    #populateGlobalMap(taskGraph) {
        const globalTask = taskGraph.getGlobalTask();

        for (const datum of globalTask.getData()) {
            if (datum.isInitialized()) {
                this.#lastUsedGlobal.set(datum.getName(), globalTask);
            }
            else {
                this.#lastUsedGlobal.set(datum.getName(), null);
            }
        }
    }

    #buildLevel(taskGraph, fun, parent, call) {
        const task = new Task(fun, parent, "REGULAR");

        // if task was called by another, add the argument names
        // as alternate names for the task param data
        if (call != null) {
            task.setCall(call);
            task.updateWithAlternateNames(call);
            this.#updateWithRepetitions(task, call);
            this.#addControlEdges(task, call, taskGraph);
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
                this.#updateWithRepetitions(task, call);
                this.#addControlEdges(externalTask, call, taskGraph);
                taskGraph.addTask(externalTask);

                task.addHierarchicalChild(externalTask);
                childTasks.push(externalTask);
            }
            // Should only happen for inlinable functions (e.g., math.h)
            else {
                //println("[TaskGraphBuilder] Found an inlinable function: " + callee.signature);
                taskGraph.addInlinable(call);
            }
        }

        // Add communications
        this.#addParentChildrenComm(taskGraph, task, childTasks);

        // update task with R/W data from the children
        this.#updateTaskWithChildrenData(task, childTasks);
        return task;
    }

    #addControlEdges(task, call, taskGraph) {
        const ifStmts = [];
        const conditions = [];
        let child = call;
        let parent = call.parent;

        do {
            if (parent.instanceOf("if")) {
                ifStmts.push(parent);
                // true if child is the "then" branch (children[1])
                // false if child is the "else" branch (children[2])
                conditions.push(parent.children[1].astId == child.astId);
            }
            child = parent;
            parent = child.parent;
        } while (!parent.instanceOf("function"));

        for (let i = 0; i < ifStmts.length; i++) {
            const ifStmt = ifStmts[i];
            const condition = conditions[i];

            const varref = ifStmt.children[0];
            const varrefName = varref.name;

            // horrible hack: we need to find the last task
            // that defines the control variable, but we 
            // are not exactly keeping track of that
            // so we just go through every task and find the 
            // last one to use the variable
            let condTask = null;
            for (const task of taskGraph.getTasks()) {
                for (const data of task.getData()) {
                    if (data.getName() == varrefName) {
                        condTask = task;
                    }
                }
            }
            // end of horrible hack
            taskGraph.addControlEdge(condTask, task, varref, condition);
        }
    }

    #updateWithRepetitions(task, call) {
        const body = call.parent.parent;
        if (body.parent.instanceOf("loop")) {
            const loop = body.parent;
            const characteristics = LoopCharacterizer.characterize(loop);
            const iterCount = characteristics.count;

            task.setRepetitions(iterCount);
            task.getLoopReference(loop);
        }
    }

    #addParentChildrenComm(taskGraph, parent, children) {
        const lastUsed = new Map();
        for (const datum of parent.getData()) {
            lastUsed.set(datum.getName(), [parent]);
        }

        for (const child of children) {
            const childData = child.getData();

            let rank = 1;
            for (const childDatum of childData) {
                if (childDatum.isFromParam()) {
                    this.#buildCommParam(parent, child, childDatum, taskGraph, rank, lastUsed);

                }
                if (childDatum.isFromGlobal()) {
                    this.#buildCommGlobal(childDatum, child, taskGraph, rank);
                }
                rank++;
            }
        }
    }

    #buildCommParam(parent, child, childDatum, taskGraph, rank, lastUsed) {
        const parentData = parent.getData();
        const dataMap = new Map();
        for (const datum of parentData) {
            dataMap.set(datum.getName(), datum);
        }

        const dataAlt = childDatum.getAlternateName();
        const parentDatum = dataMap.get(dataAlt);
        const lastUsedTasks = lastUsed.get(dataAlt);

        if (lastUsedTasks != null) {
            for (const lastUsedTask of lastUsedTasks) {
                taskGraph.addCommunication(lastUsedTask, child, parentDatum, childDatum, rank);
            }

            if (childDatum.isWritten()) {
                if (child.getIncomingControl().length > 0) {
                    if (lastUsedTasks.length == 1) {
                        lastUsed.set(dataAlt, [lastUsedTasks[0], child]);
                    }
                    else {
                        const newLastUsed = [];
                        for (const lastUsed of lastUsedTasks) {
                            if (lastUsed.getIncomingControl().length > 0) {
                                newLastUsed.push(lastUsed);
                            }
                        }
                        newLastUsed.push(child);
                        lastUsed.set(dataAlt, newLastUsed);
                    }
                }
                else {
                    lastUsed.set(dataAlt, [child]);
                }
            }
        }
        else {
            println("[TaskGraphBuilder] WARNING: " + dataAlt + " not found in " + parent.getName());
        }
    }

    // TODO: implement conditionals for this as well
    #buildCommGlobal(childDatum, child, taskGraph, rank) {
        const dataName = childDatum.getName();
        const lastUsedTask = this.#lastUsedGlobal.get(dataName);

        let parentDatum = childDatum;
        for (const datum of lastUsedTask.getData()) {
            if (datum.getName() == dataName) {
                parentDatum = datum;
                break;
            }
        }

        if (lastUsedTask != null && lastUsedTask != child) {
            taskGraph.addCommunication(lastUsedTask, child, parentDatum, childDatum, rank);
        }
        if (childDatum.isWritten()) {
            this.#lastUsedGlobal.set(dataName, child);
        }
    }

    #updateTaskWithChildrenData(task, children) {
        const dataMap = task.getDataAsMap();

        for (const child of children) {
            for (const data of child.getParamData()) {
                const altName = data.getAlternateName();

                if (data.isWritten()) {
                    dataMap.get(altName).setWritten();
                }
            }
        }
    }
}