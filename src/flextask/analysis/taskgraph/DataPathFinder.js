"use strict";

class DataPathFinder {
    #taskGraph;

    constructor(taskGraph) {
        this.#taskGraph = taskGraph;
    }

    calculateDataPaths() {
        const dataItems = this.#getNewDataItems();
        const dataPaths = {};

        for (const dataItem of dataItems) {
            const path = this.#findDataPath(dataItem);
            dataPaths[dataItem] = path;
        }
        return dataPaths;
    }

    #getNewDataItems() {
        const dataItems = [];
        const tasks = this.#taskGraph.getTasks();

        for (const task of tasks) {
            if (task.getType() === "REGULAR" || task.getType() === "EXTERNAL") {
                dataItems.push(...task.getNewData());
            }
        }
        const sourceTask = this.#taskGraph.getSourceTask();
        dataItems.push(...sourceTask.getData());
        println("sourceTask.getData(): " + sourceTask.getData());

        const globalTask = this.#taskGraph.getGlobalTask();
        dataItems.push(...globalTask.getData());

        return dataItems;
    }

    #findDataPath(dataItem) {
        println(dataItem.getName() + " " + dataItem.getOrigin());
    }
}