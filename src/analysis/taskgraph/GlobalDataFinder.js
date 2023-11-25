"use strict";

class GlobalDataFinder {
    #taskGraph;

    constructor(taskGraph) {
        this.#taskGraph = taskGraph;
    }

    calculateGlobalData() {
        const dataPerTask = {};
        const tasks = this.#taskGraph.getTasks();

        for (const task of tasks) {
            const taskData = {};

            for (const datum of task.getData()) {
                const datumProps = {
                    "origin": datum.getOriginType(),
                    "sizeInBytes": datum.getSizeInBytes(),
                    "cxxType": datum.getDatatype(),
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
            const taskName = task.getUniqueName();
            dataPerTask[taskName] = taskData;
        }
        return dataPerTask;
    }
}