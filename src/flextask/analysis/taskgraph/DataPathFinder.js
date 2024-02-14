"use strict";

class DataPathFinder {
    #taskGraph;

    constructor(taskGraph) {
        this.#taskGraph = taskGraph;
    }

    calculateDataPaths() {
        const dataSourceDistance = {};
        const tasks = this.#taskGraph.getTasks();

        for (const task of tasks) {
            const commOfTask = {};

            for (const datum of task.getData()) {

            }
            const taskName = task.getUniqueName();
            dataSourceDistance[taskName] = commOfTask;
        }
        return dataSourceDistance;
    }
}