"use strict";

class TaskGraphStatFinder {
    #taskGraph;

    constructor(taskGraph) {
        this.#taskGraph = taskGraph;
    }

    calculateTaskGraphStats() {
        const taskTypes = {};
        let externalCnt = 0;
        let regularCnt = 0;

        const tasks = this.#taskGraph.getTasks();
        for (const task of tasks) {
            const taskName = task.getName();
            const taskType = task.getType();
            taskTypes[taskName] = taskType;

            if (taskType === "EXTERNAL") {
                externalCnt++;
            }
            if (taskType === "REGULAR") {
                regularCnt++;
            }
        }

        const nTasks = regularCnt + externalCnt;
        const nEdges = this.#taskGraph.getCommunications().length;
        const nInlinables = this.#taskGraph.getInlinables().length;
        const nGlobals = this.#taskGraph.getGlobalTask().getData().length;

        const result = {};
        result["counts"] = {
            "#tasks": nTasks,
            "#edges": nEdges,
            "externalTasks": externalCnt,
            "regularTasks": regularCnt,
            "inlinableCalls": nInlinables,
            "globalVars": nGlobals,

        };
        result["uniqueTaskTypes"] = taskTypes;

        return result;
    }
}