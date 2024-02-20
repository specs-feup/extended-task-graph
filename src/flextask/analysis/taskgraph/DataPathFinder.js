"use strict";

class DataPathFinder {
    #taskGraph;

    constructor(taskGraph) {
        this.#taskGraph = taskGraph;
    }

    calculateDataPaths() {
        const itemsAndTasks = this.#getNewDataItems();
        const dataPaths = {};

        for (const itemAndTask of itemsAndTasks) {
            const dataItem = itemAndTask.item;
            const task = itemAndTask.task;

            const paths = this.#findDataPath(dataItem, task);
            dataPaths[dataItem.getName()] = {
                "datatype": dataItem.getDatatype(),
                "sizeInBytes": dataItem.getSizeInBytes(),
                "mainPath": paths.mainPath,
                "mainPathLength": paths.mainPath.length,
                "spurs": paths.spurs,
                "#spurs": paths.spurs.length,
                "aliases": [...paths.aliases],
                "#aliases": paths.aliases.size
            };
        }
        return dataPaths;
    }

    #getNewDataItems() {
        const itemsAndTasks = [];
        const tasks = [...this.#taskGraph.getTasks(), this.#taskGraph.getSourceTask(), this.#taskGraph.getSinkTask(), this.#taskGraph.getGlobalTask()];

        for (const task of tasks) {
            if (task.getType() == "START" || task.getType() == "REGULAR" || task.getType() == "EXTERNAL") {
                for (const dataItem of task.getNewData()) {
                    itemsAndTasks.push({ "item": dataItem, "task": task });
                }
            }
            if (task.getType() == "GLOBAL") {
                for (const dataItem of task.getGlobalData()) {
                    itemsAndTasks.push({ "item": dataItem, "task": task });
                }
            }
        }
        return itemsAndTasks;
    }

    #findDataPath(dataItem, task) {
        const mainPath = [task.getName()];
        const spurs = [];
        const aliases = new Set();
        aliases.add(dataItem.getName());

        for (const comm of task.getOutgoingOfData(dataItem)) {
            const targetTask = comm.getTarget();
            const targetDataItem = comm.getTargetData();
            aliases.add(targetDataItem.getName());

            if (targetDataItem.isOnlyRead()) {
                spurs.push(targetTask.getName());
            }
            if (targetDataItem.isWritten()) {
                const paths = this.#findDataPath(targetDataItem, targetTask);
                mainPath.push(...paths.mainPath);
                spurs.push(...paths.spurs);
                paths.aliases.forEach(alias => aliases.add(alias));
            }
        }
        return { "mainPath": mainPath, "spurs": spurs, "aliases": aliases };
    }
}