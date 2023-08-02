"use strict";

laraImport("taskgraph/TaskGraph");
laraImport("weaver.Query");

class TaskGraphMetricsAggregator {
    #taskGraph;
    #metrics = {};

    constructor(appName, taskGraph) {
        this.#metrics["appName"] = appName;
        this.#taskGraph = taskGraph;
    }

    getMetrics() {
        return this.#metrics;
    }

    getMetricsAsJson() {
        return JSON.stringify(this.#metrics, null, 4);
    }

    updateMetrics() {
        this.#calculateTaskStats();
        this.#calculateUniqueTasks();
        this.#calculateDataPerTask();
        this.#calculateGlobalData();
        this.#calculateDataSourceDistance();
        return this.#metrics;
    }

    #calculateTaskStats() {
        const taskTypes = {};
        let externalCnt = 0;
        let regularCnt = 0;

        const tasks = this.#taskGraph.getTasks();
        for (const task of tasks) {
            const taskName = task.getFunction().name;
            const taskType = task.getType();
            taskTypes[taskName] = taskType;

            if (taskType === "EXTERNAL") {
                externalCnt++;
            }
            if (taskType === "REGULAR") {
                regularCnt++;
            }
        }
        const nInlinables = this.#taskGraph.getInlinables().length;
        const nGlobals = this.#taskGraph.getGlobalTask().getData().length;

        this.#metrics["counts"] = { "externalTasks": externalCnt, "regularTasks": regularCnt, "inlinableCalls": nInlinables, "globalVars": nGlobals };
        this.#metrics["uniqueTaskTypes"] = taskTypes;
    }

    #calculateUniqueTasks() {
        const uniqueTasks = {};
        const tasks = this.#taskGraph.getTasks();

        for (const task of tasks) {
            const taskName = task.getName();

            if (taskName in uniqueTasks) {
                uniqueTasks[taskName]++;
            }
            else {
                uniqueTasks[taskName] = 1;
            }
        }
        this.#metrics["uniqueTaskInstances"] = uniqueTasks;
    }

    #calculateDataPerTask() {
        const dataPerTask = {};
        const tasks = this.#taskGraph.getTasks();

        for (const task of tasks) {
            const taskData = {};

            for (const datum of task.getData()) {
                const datumProps = {
                    "origin": datum.getOriginType(),
                    "sizeInBytes": datum.getSizeInBytes(),
                    "cxxType": datum.getType(),
                    "isScalar": datum.isScalar(),
                    "alternateName": datum.getAlternateName(),
                    "stateChanges": {
                        "isInit": datum.isInitialized(),
                        "isWritten": datum.isWritten(),
                        "isRead": datum.isRead()
                    }
                }
                taskData[datum.getName()] = datumProps;
            }
            const taskName = task.getId() + "-" + task.getName();
            dataPerTask[taskName] = taskData;
        }
        this.#metrics["dataPerTask"] = dataPerTask;
    }

    #calculateGlobalData() {
        const globalData = {};
        const globalTask = this.#taskGraph.getGlobalTask();

        for (const datum of globalTask.getData()) {
            const datumProps = {
                "origin": datum.getOriginType(),
                "sizeInBytes": datum.getSizeInBytes(),
                "cxxType": datum.getType(),
                "isScalar": datum.isScalar(),
                "alternateName": datum.getAlternateName(),
                "stateChanges": {
                    "isInit": datum.isInitialized(),
                    "isWritten": datum.isWritten(),
                    "isRead": datum.isRead()
                }
            }
            globalData[datum.getName()] = datumProps;
        }
        this.#metrics["globalData"] = globalData;
    }

    #calculateDataSourceDistance() {
        const dataSourceDistance = {};
        const tasks = this.#taskGraph.getTasks();

        for (const task of tasks) {
            const commOfTask = {};

            for (const datum of task.getData()) {
                const path = this.#calculateDistanceToOrigin(datum, task);
                commOfTask[datum.getName()] = { "pathToOrigin": path, "distanceToOrigin": path.length };
            }
            const taskName = task.getName();
            dataSourceDistance[taskName] = commOfTask;
        }
        this.#metrics["dataSourceDistance"] = dataSourceDistance;
    }

    #calculateDistanceToOrigin(datum, task, path = []) {
        path.push(task.getUniqueName());

        if (task.getType() === "GLOBAL" || task.getType() === "START") {
            return path;
        }
        if (datum.isNewlyCreated()) {
            return path;
        }
        return path;


    }
}