import { ConcreteTask } from "extended-task-graph/ConcreteTask";
import { TaskGraph } from "extended-task-graph/TaskGraph";
import { TopologicalSort } from "./util/TopologicalSort.js";

export class Cluster {
    private etg: TaskGraph;
    private tasks: ConcreteTask[] = [];

    constructor(etg: TaskGraph) {
        this.etg = etg;
    }

    addTask(task: ConcreteTask): boolean {
        if (this.tasks.length == 0) {
            this.tasks.push(task);
            return true;
        }
        else {
            // TODO: checks
            this.tasks.push(task);
            this.tasks = TopologicalSort.sort(this.tasks) as ConcreteTask[];
            return true;
        }
    }

    getTasks(): ConcreteTask[] {
        return this.tasks;
    }

    getInOuts(): [string, ClusterInOut][] {
        const inOuts: [string, ClusterInOut][] = [];

        return inOuts;
    }
}

export enum ClusterInOut {
    READ = "READ",
    WRITE = "WRITE",
    READ_WRITE = "READ_WRITE"
}