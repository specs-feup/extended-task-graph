"use strict";

laraImport("taskgraph/TaskGraph");
laraImport("weaver.Query");

class ParallelTaskFinder {
    constructor() { }

    findTaskPairs(taskGraph) {
        return {};
    }

    areParallel(task1, task2, taskGraph) {
        return false;
    }

    getAllParallelTasks(taskPairs, taskGraph) {
        return {};
    }
}