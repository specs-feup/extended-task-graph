"use strict";

laraImport("taskgraph/TaskGraph");
laraImport("analysis/taskgraph/TopologicalSort");
laraImport("weaver.Query");

class CriticalPathFinder {
    constructor() { }

    findCriticalPaths(taskGraph) {
        const paths = {};

        for (const task of taskGraph.getTasks()) {
            const pathInfo = this.findPathInHierarchy(task);
            if (pathInfo["#Tasks"] > 1) {
                paths[task.getId()] = pathInfo;
            }
        }
        return paths;
    }

    findPathInHierarchy(task) {
        const children = task.getHierarchicalChildren();
        const nTasks = children.length;

        if (nTasks === 0) {
            const path = {
                "#Tasks": 1,
                "criticalPathLength": 1,
                "parallelismMeasure": 1,
                "hierachicalParent": task.getName(),
                "criticalPath": [task.getId() + " : " + task.getName()],
            };
            return path;
        }
        if (nTasks === 1) {
            const path = {
                "#Tasks": 1,
                "criticalPathLength": 1,
                "parallelismMeasure": 1,
                "hierachicalParent": task.getName(),
                "criticalPath": [children[0].getId() + " : " + children[0].getName()],
            };
            return path;
        }
        else {
            const criticalPath = this.#findCriticalPath(task);
            const criticalPathLength = criticalPath.length;
            const parallelismMeasure = nTasks / criticalPathLength;

            const path = {
                "#Tasks": nTasks,
                "criticalPathLength": criticalPathLength,
                "parallelismMeasure": parallelismMeasure,
                "hierachicalParent": task.getName(),
                "criticalPath": criticalPath,
            };
            return path;
        }
    }

    #findCriticalPath(parentTask) {
        const children = parentTask.getHierarchicalChildren();

        // just to have this return something:
        /*
        const replica = [];
        for (const child of children) {
            replica.push(child);
        }
        return replica;*/

        const sorter = new TopologicalSort(children);
        const sortedChildren = sorter.performSort();

        const distances = {};
        const predecessors = {};
        for (const task of sortedChildren) {
            distances[task.getId()] = 0;
            predecessors[task.getId()] = null;
        }

        distances[sortedChildren[0].getId()] = 0;

        for (const task of sortedChildren) {
            const outgoingEdges = task.getOutgoingComm();

            for (const edge of outgoingEdges) {
                const target = edge.getTarget();
                const distance = distances[task.getId()] + 1;

                if (distance > distances[target.getId()]) {
                    distances[target.getId()] = distance;
                    predecessors[target.getId()] = task;
                }
            }
        }

        let maxDistance = -1;
        let maxTask = null;
        for (const task of sortedChildren) {
            const distance = distances[task.getId()];
            if (distance > maxDistance) {
                maxDistance = distance;
                maxTask = task;
            }
        }

        const criticalPath = [];
        let currentTask = maxTask;
        while (currentTask != null) {
            criticalPath.push(currentTask.getName());
            currentTask = predecessors[currentTask.getId()];
        }

        return criticalPath.reverse();
    }
}




