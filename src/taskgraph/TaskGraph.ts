import { Call, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import { Communication } from "./Communication.js";
import { ControlEdge } from "./ControlEdge.js";
import { ConcreteTask } from "./tasks/ConcreteTask.js";
import { GlobalTask } from "./tasks/GlobalTask.js";
import { SinkTask } from "./tasks/SinkTask.js";
import { SourceTask } from "./tasks/SourceTask.js";
import { TaskType } from "./tasks/TaskType.js";
import { Task } from "./tasks/Task.js";
import { DataItem } from "./DataItem.js";

export class TaskGraph {
    #tasks: ConcreteTask[] = [];
    #comms: Communication[] = [];
    #control: ControlEdge[] = [];
    #sourceTask: SourceTask;
    #sinkTask: SinkTask;
    #globalTask: GlobalTask;
    #inlinables: Call[] = [];

    constructor() {
        this.#sourceTask = new SourceTask();
        this.#sinkTask = new SinkTask();
        this.#globalTask = new GlobalTask();
    }

    addTasks(tasks: ConcreteTask[]): void {
        this.#tasks.push(...tasks);
    }

    addTask(task: ConcreteTask): void {
        this.#tasks.push(task);
    }

    addInlinable(call: Call): void {
        this.#inlinables.push(call);
    }

    getTasks(): ConcreteTask[] {
        return this.#tasks;
    }

    getTaskById(id: string): ConcreteTask | null {
        for (const task of this.#tasks) {
            if (task.getId() === id) {
                return task;
            }
        }
        return null;
    }

    getTasksByType(type: TaskType): ConcreteTask[] {
        const tasks = [];
        for (const task of this.#tasks) {
            if (task.getType() === type) {
                tasks.push(task);
            }
        }
        return tasks;
    }

    getSourceTask(): SourceTask {
        return this.#sourceTask;
    }

    getSinkTask(): SinkTask {
        return this.#sinkTask;
    }

    getGlobalTask(): GlobalTask {
        return this.#globalTask;
    }

    getCommunications(): Communication[] {
        return this.#comms;
    }

    getControlEdges(): ControlEdge[] {
        return this.#control;
    }

    getInlinables(): Call[] {
        return this.#inlinables;
    }

    getTopHierarchicalTask(): ConcreteTask | null {
        for (const task of this.#tasks) {
            if (task.getHierarchicalParent() == null) {
                return task;
            }
        }
        return null;
    }

    addCommunication(source: Task, target: Task, sourceData: DataItem, targetData: DataItem, rank: number): void {
        const comm = new Communication(source, target, sourceData, targetData, rank);
        this.#comms.push(comm);
        source.addOutgoingComm(comm);
        target.addIncomingComm(comm);
    }

    addControlEdge(source: Task, target: Task, controlVar: Varref, controlValue: number | boolean): void {
        const val = (typeof controlValue === "number") ? controlValue : (controlValue ? 1 : 0);

        const control = new ControlEdge(source, target, controlVar, val);
        this.#control.push(control);
        source.addOutgoingControl(control);
        target.addIncomingControl(control);
    }
}