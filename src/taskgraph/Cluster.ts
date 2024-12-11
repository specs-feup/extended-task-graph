import { ConcreteTask } from "extended-task-graph/ConcreteTask";
import { TopologicalSort } from "./util/TopologicalSort.js";

export class Cluster {
    private name: string = "";
    private tasks: ConcreteTask[] = [];

    constructor(name: string = "cluster") {
        this.name = name;
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

    getName(): string {
        return this.name;
    }

    getTasks(): ConcreteTask[] {
        return this.tasks;
    }

    getTaskUniqueName(): string[] {
        return this.tasks.map(t => t.getUniqueName());
    }

    getInOuts(): [string, ClusterInOut][] {
        const inOuts: [string, ClusterInOut][] = [];
        const names = this.getTaskUniqueName();
        const params: string[] = [];

        for (const task of this.tasks) {

        }


        return inOuts;
    }
}

export enum ClusterInOut {
    READ = "READ",
    WRITE = "WRITE",
    READ_WRITE = "READ_WRITE"
}