"use strict";

laraImport("flextask/taskgraph/TaskGraph");
laraImport("weaver.Query");

class ParallelTaskFinder {
    constructor() { }

    findTaskPairs(taskGraph) {
        const pairs = [];

        for (const task of taskGraph.getTasks()) {
            const children = task.getHierarchicalChildren();

            // we can only have pairs if we have at least 2 children
            if (children.length >= 2) {

                // do combinations of 2 for all children
                for (let i = 0; i < children.length; i++) {
                    for (let j = i + 1; j < children.length; j++) {
                        pairs.push([children[i], children[j]]);
                    }
                }
            }
        }
        return pairs;
    }

    areParallel(task1, task2) {
        for (const datum of task1.getReferencedData()) {
            const isInPath = this.datumIntesectsTask(datum, task1, task2);
            if (isInPath) {
                return false;
            }
        }
        for (const datum of task2.getReferencedData()) {
            const isInPath = this.datumIntesectsTask(datum, task2, task1);
            if (isInPath) {
                return false;
            }
        }
        return true;
    }

    datumIntesectsTask(datum, task, taskIntersect) {
        // I don't like the while(true) here, but it works
        while (true) {
            const comm = task.getIncomingOfData(datum);
            if (comm === null) {
                return false;
            }
            const taskSrc = comm.getSource();
            if (taskSrc.getId() == taskIntersect.getId()) {
                return true;
            }
            task = taskSrc;
        }
    }

    getPairToParallelMap(taskPairs, taskGraph) {
        const mapping = [];

        for (const pair of taskPairs) {
            const parallel = this.areParallel(pair[0], pair[1], taskGraph);

            const firstTaskName = pair[0].getId() + " : " + pair[0].getName();
            const secondTaskName = pair[1].getId() + " : " + pair[1].getName();
            const parentHier = pair[0].getHierarchicalParent();
            const hierParentName = parentHier.getId() + " : " + parentHier.getName();

            const map = {
                "pair": [firstTaskName, secondTaskName],
                "areParallel": parallel,
                "hierarchicalParent": hierParentName
            };
            mapping.push(map);
        }
        return mapping;
    }
}