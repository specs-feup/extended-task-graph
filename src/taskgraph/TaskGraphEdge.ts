import { Task } from "./tasks/Task.js";

export abstract class TaskGraphEdge {
    private source: Task;
    private target: Task;

    constructor(source: Task, target: Task) {
        this.source = source;
        this.target = target;
    }

    public getSource(): Task {
        return this.source;
    }

    public getTarget(): Task {
        return this.target;
    }

    public setSource(source: Task): void {
        this.source = source;
    }

    public setTarget(target: Task): void {
        this.target = target;
    }

    public abstract toString(): string;
}