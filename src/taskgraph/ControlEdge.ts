import { Varref } from "@specs-feup/clava/api/Joinpoints.js";
import { Task } from "./tasks/Task.js";

export class ControlEdge {
    private source: Task;
    private target: Task;
    private controlVar: Varref;
    private controlValue: number;

    constructor(source: Task, target: Task, controlVar: Varref, controlValue: number) {
        this.source = source;
        this.target = target;
        this.controlVar = controlVar;
        this.controlValue = controlValue;
    }

    public getSource(): Task {
        return this.source;
    }

    public getTarget(): Task {
        return this.target;
    }

    public getControlVariable(): Varref {
        return this.controlVar;
    }

    public getControlValue(): number {
        return this.controlValue;
    }

    public setControlValue(value: number): void {
        this.controlValue = value;
    }

    public toString(): string {
        const str = `${this.controlVar.name}\n${this.controlValue ? "TRUE" : "FALSE"}`;
        return str;
    }
}