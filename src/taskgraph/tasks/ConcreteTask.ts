import { Call, Loop } from "@specs-feup/clava/api/Joinpoints.js";
import { Task } from "./Task.js";
import { TaskType } from "./TaskType.js";
import IdGenerator from "@specs-feup/lara/api/lara/util/IdGenerator.js";

export class ConcreteTask extends Task {
    #call: Call | null;
    #hierParent: Task | null = null;
    #hierChildren: Set<ConcreteTask> = new Set();
    #repetitions = 1;
    #loopRef: Loop | null = null;

    constructor(type: TaskType.REGULAR | TaskType.EXTERNAL, call: Call | null, hierParent: Task | null, name: string, delimiter = ".", prefix = "T") {
        super(type);

        const idPrefix = (hierParent != null && hierParent.getType() == TaskType.REGULAR) ?
            `${hierParent.getId()}${delimiter}` : prefix;
        const id = IdGenerator.next(idPrefix);

        this.setId(id);
        this.setName(name);
        this.#call = call;
        if (hierParent != null) {
            this.#hierParent = hierParent;
        }
    }

    getCall(): Call | null {
        return this.#call;
    }

    // Repetitions
    setRepetitions(reps: number, loopRef: Loop): void {
        this.#repetitions = reps;
        this.#loopRef = loopRef;
    }

    getRepetitions(): number {
        return this.#repetitions;
    }

    getLoopReference(): Loop | null {
        return this.#loopRef;
    }

    // Hierarchical stuff
    getHierarchicalParent(): Task | null {
        return this.#hierParent;
    }

    getHierarchicalChildren(): ConcreteTask[] {
        return [...this.#hierChildren];
    }

    addHierarchicalChild(child: ConcreteTask): void {
        this.#hierChildren.add(child);
    }

    removeHierarchicalChild(child: ConcreteTask): void {
        this.#hierChildren.delete(child);
    }
}