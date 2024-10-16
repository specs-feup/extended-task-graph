"use strict";

laraImport("weaver.Query");
laraImport("clava.code.LoopCharacterizer");
laraImport("flextask/AStage");
laraImport("flextask/taskgraph/TaskGraph");
laraImport("flextask/taskgraph/tasks/Task");
laraImport("flextask/taskgraph/tasks/RegularTask");
laraImport("flextask/taskgraph/tasks/ExternalTask");
laraImport("flextask/taskgraph/Communication");


class TaskGraphBuilder extends AStage {
    #lastUsedGlobal = new Map();

    constructor(topFunction, outputDir, appName) {
        super("TGGFlow-TaskGraphBuilder", topFunction, outputDir, appName);
    }

    build() {
        const taskGraph = new TaskGraph();
        this.#populateGlobalMap(taskGraph);

        const topFunctionJoinPoint = this.getTopFunctionJoinPoint();
        const topTask = this.#buildLevel(taskGraph, topFunctionJoinPoint, null, null, true);

        let rank = 1;
        for (const dataItem of topTask.getReferencedData()) {
            const sourceTask = taskGraph.getSourceTask();
            const itemInSource = sourceTask.addDataToSource(dataItem);

            taskGraph.addCommunication(sourceTask, topTask, itemInSource, dataItem, rank);
            rank++;
        }
        rank = 1;
        for (const dataItem of topTask.getDataWritten()) {
            const sinkTask = taskGraph.getSinkTask();
            const itemInSink = sinkTask.addDataToSink(dataItem);

            taskGraph.addCommunication(topTask, sinkTask, dataItem, itemInSink, rank);
            rank++;
        }

        return taskGraph;
    }

    #populateGlobalMap(taskGraph) {
        const globalTask = taskGraph.getGlobalTask();

        for (const dataItem of globalTask.getGlobalDeclData()) {
            // Assume that it is always initialized
            // We can decide on a better policy later
            this.#lastUsedGlobal.set(dataItem.getName(), globalTask);
        }
    }

    #buildLevel(taskGraph, fun, parent, call, firstLevel = false) {
        const task = new RegularTask(call, fun, parent);
        if (!firstLevel) {
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
                const externalTask = new ExternalTask(call, task);

                this.#updateWithRepetitions(task, call);
                this.#addControlEdges(externalTask, call, taskGraph);

                task.addHierarchicalChild(externalTask);
                taskGraph.addTask(externalTask);
                childTasks.push(externalTask);
            }

            // Should only happen for inlinable functions (e.g., math.h)
            else {
                //println("[TaskGraphBuilder] Found an inlinable function: " + callee.signature);
                taskGraph.addInlinable(call);
            }
        }

        // Add communications
        //this.#addParentChildrenComm(taskGraph, task, childTasks);
        this.#addSubgraphComm(taskGraph, task, childTasks);

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
            const iterCount = characteristics.count == undefined ? -1 : characteristics.count;

            task.setRepetitions(iterCount, loop);
            this.log("Task " + task.getUniqueName() + " has " + iterCount + " repetitions");
        }
    }

    #addSubgraphComm(taskGraph, parent, children) {
        // First, we start by building a handy mapping between task and task name
        const nameToTask = new Map();
        for (const task of children) {
            nameToTask.set(task.getUniqueName(), task);
        }
        nameToTask.set(parent.getUniqueName(), parent);

        // Then, we build a map of the last task that used each data item
        // (which, at the beginning, is the parent task itself)
        const lastUsed = new Map();
        for (const dataItem of parent.getData()) {
            lastUsed.set(dataItem.getName(), parent.getUniqueName());
        }

        for (const child of children) {
            let rank = 1;

            const childParams = child.getParamData();
            for (const dataItem of childParams) {
                this.buildCommParam(dataItem, lastUsed, nameToTask, child, taskGraph, rank);
                rank++;
            }

            const childGlobals = child.getGlobalRefData();
            for (const dataItem of childGlobals) {
                this.#buildCommGlobal(dataItem, child, taskGraph, rank);
                rank++;
            }
        }
    }

    buildCommParam(dataItem, lastUsed, nameToTask, child, taskGraph, rank) {
        const altName = dataItem.getAlternateName();
        const lastUsedTaskName = lastUsed.get(altName);
        const lastUsedTask = nameToTask.get(lastUsedTaskName);
        const lastUsedDataItem = lastUsedTask.getDataItemByAltName(altName);

        if (lastUsedTask != null && lastUsedTask != child) {
            taskGraph.addCommunication(lastUsedTask, child, lastUsedDataItem, dataItem, rank);

            if (dataItem.isWritten()) {
                lastUsed.set(altName, child.getUniqueName());
            }
        }
    }

    // TODO: implement conditionals for this as well
    #buildCommGlobal(dataItem, task, taskGraph, rank) {
        const dataName = dataItem.getName();
        const lastUsedTask = this.#lastUsedGlobal.get(dataName);
        const dataItemInParent = lastUsedTask.getDataItemByName(dataName);

        if (lastUsedTask != null && lastUsedTask != task) {
            taskGraph.addCommunication(lastUsedTask, task, dataItemInParent, dataItem, rank);
        }
        if (dataItem.isWritten()) {
            this.#lastUsedGlobal.set(dataName, task);
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