import { TaskGraphEdge } from "./TaskGraphEdge.js";
import { Task } from "./tasks/Task.js";

export class ControlEdge extends TaskGraphEdge {

    constructor(source: Task, target: Task) {
        super(source, target);
    }

    public toString(): string {
        const str = `<ctrl dep>`;
        return str;
    }
}