import { Call, Loop } from "@specs-feup/clava/api/Joinpoints.js";
import { Task } from "./Task.js";
import { TaskType } from "./TaskType.js";
import IdGenerator from "@specs-feup/lara/api/lara/util/IdGenerator.js";

export class ConcreteTask extends Task {
    private call: Call | null;
    private hierParent: ConcreteTask | null = null;
    private hierChildren: Set<ConcreteTask> = new Set();
    private repetitions = 1;
    private loopRef: Loop | null = null;

    constructor(type: TaskType.REGULAR | TaskType.EXTERNAL, call: Call | null, hierParent: ConcreteTask | null, name: string, delimiter = ".", prefix = "T") {
        super(type);
        this.setName(name);

        const idPrefix = (hierParent != null && hierParent.getType() == TaskType.REGULAR) ?
            `${hierParent.getId()}${delimiter}` : prefix;
        const id = IdGenerator.next(idPrefix);
        this.setId(id);

        this.call = call;

        if (hierParent != null) {
            this.hierParent = hierParent;
        }
    }

    public getCall(): Call | null {
        return this.call;
    }

    public setRepetitions(reps: number, loopRef: Loop): void {
        this.repetitions = reps;
        this.loopRef = loopRef;
    }

    public getRepetitions(): number {
        return this.repetitions;
    }

    public getLoopReference(): Loop | null {
        return this.loopRef;
    }

    public getHierarchicalParent(): ConcreteTask | null {
        return this.hierParent;
    }

    public getHierarchicalChildren(): ConcreteTask[] {
        return [...this.hierChildren];
    }

    public addHierarchicalChild(child: ConcreteTask): void {
        this.hierChildren.add(child);
    }

    public removeHierarchicalChild(child: ConcreteTask): void {
        this.hierChildren.delete(child);
    }
}