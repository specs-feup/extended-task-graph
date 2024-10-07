import { Varref } from "@specs-feup/clava/api/Joinpoints.js";
import { Task } from "./tasks/Task.js";

export class ControlEdge {
    source: Task;
    target: Task;
    controlVar: Varref;
    controlValue: number;

    constructor(source: Task, target: Task, controlVar: Varref, controlValue: number) {
        this.source = source;
        this.target = target;
        this.controlVar = controlVar;
        this.controlValue = controlValue;
    }

    getSource(): Task {
        return this.source;
    }

    getTarget(): Task {
        return this.target;
    }

    getControlVariable(): Varref {
        return this.controlVar;
    }

    getControlValue(): number {
        return this.controlValue;
    }

    setControlValue(value: number): void {
        this.controlValue = value;
    }

    toString(): string {
        const str = `${this.controlVar.name}\n${this.controlValue ? "TRUE" : "FALSE"}`;
        return str;
    }
}