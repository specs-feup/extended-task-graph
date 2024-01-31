"use strict";

class DataSourceFinder {
    #taskGraph;

    constructor(taskGraph) {
        this.#taskGraph = taskGraph;
    }

    calculateDataSourceDistance() {
        const dataSourceDistance = {};
        const tasks = this.#taskGraph.getTasks();

        for (const task of tasks) {
            const commOfTask = {};

            for (const datum of task.getData()) {
                const pathAndEvo = this.#calculateDistanceToOrigin(datum, task);
                const path = pathAndEvo[0];
                const dataEvo = pathAndEvo[1];
                commOfTask[datum.getName()] = { "pathToOrigin": path, "dataEvolution": dataEvo, "distanceToOrigin": path.length };
            }
            const taskName = task.getUniqueName();
            dataSourceDistance[taskName] = commOfTask;
        }
        return dataSourceDistance;
    }

    #calculateDistanceToOrigin(datum, task) {
        const path = [task.getUniqueName()];
        const dataEvo = [datum.getName()];

        if (task.getType() === "GLOBAL" || task.getType() === "START") {
            return [path, dataEvo];
        }
        if (datum.isNewlyCreated() || datum.isConstant()) {
            return [path, dataEvo];
        }
        else {
            const comm = task.getIncomingOfData(datum);
            if (comm == null) {
                this.log("ERROR: No incoming communication found for data " + datum.getName() + " of task " + task.getUniqueName());
                return [path, dataEvo];
            }
            else {
                const srcTask = comm.getSource();
                const srcDatum = comm.getSourceData();

                const remaining = this.#calculateDistanceToOrigin(srcDatum, srcTask);
                const remainingPath = remaining[0];
                const remainingDataEvo = remaining[1];

                path.push(...remainingPath);
                dataEvo.push(...remainingDataEvo);
                return [path, dataEvo];
            }
        }
    }
}