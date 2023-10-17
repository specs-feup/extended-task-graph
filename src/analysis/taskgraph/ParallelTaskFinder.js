"use strict";

laraImport("taskgraph/TaskGraph");
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

    areParallel(task1, task2, taskGraph) {
        return false;
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