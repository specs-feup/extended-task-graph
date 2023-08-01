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

        this.#metrics["taskTypes"] = taskTypes;
        this.#metrics["counts"] = { "externalTasks": externalCnt, "regularTasks": regularCnt, "inlinableCalls": nInlinables };
    }
}