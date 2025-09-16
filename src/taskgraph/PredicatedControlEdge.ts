import { Varref } from "@specs-feup/clava/api/Joinpoints.js";
import { Task } from "./tasks/Task.js";
import { ControlEdge } from "./ControlEdge.js";

export class PredicatedControlEdge extends ControlEdge {
    private controlVar: Varref;
    private controlValue: number;

    constructor(source: Task, target: Task, controlVar: Varref, controlValue: number) {
        super(source, target);
        this.controlVar = controlVar;
        this.controlValue = controlValue;
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