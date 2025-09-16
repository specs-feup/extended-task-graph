import { Task } from "./tasks/Task.js";

export class ControlEdge {
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

    public toString(): string {
        const str = `<ctrl dep>`;
        return str;
    }
}