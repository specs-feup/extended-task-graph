import { TaskGraph } from "../../taskgraph/TaskGraph.js";
import { ConcreteTask } from "../../taskgraph/tasks/ConcreteTask.js";
import { Task } from "../../taskgraph/tasks/Task.js";
import { TopologicalSort } from "../../taskgraph/util/TopologicalSort.js";
import { TaskGraphStat } from "./TaskGraphStat.js";

export class CriticalPathFinder extends TaskGraphStat {

    constructor(taskGraph: TaskGraph) {
        super("criticalPaths", taskGraph);
    }

    public getStatSummary(): Record<string, any> {
        const paths: Record<string, any> = {};

        for (const task of this.taskGraph.getTasks()) {
            const pathInfo = this.findPathInHierarchy(task);
            if (pathInfo["#Tasks"] > 1) {
                paths[task.getId()] = pathInfo;
            }
        }
        return paths;
    }

    private findPathInHierarchy(task: ConcreteTask): Record<string, any> {
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
            const criticalPath = this.findCriticalPath(task);
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

    private findCriticalPath(parentTask: ConcreteTask): string[] {
        const children = parentTask.getHierarchicalChildren();

        const sortedChildren = TopologicalSort.sort(children);

        const distances: Record<string, number> = {};
        const predecessors: Record<string, Task | null> = {};

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

        const criticalPath: string[] = [];
        let currentTask = maxTask;
        while (currentTask != null && !criticalPath.includes(currentTask.getName())) {
            criticalPath.push(currentTask.getName());
            currentTask = predecessors[currentTask.getId()];
        }

        return criticalPath.reverse();
    }
}




