import { TopologicalSort } from "./util/TopologicalSort.js";
import { DataItem } from "./dataitems/DataItem.js";
import { Call } from "@specs-feup/clava/api/Joinpoints.js";
import { ConcreteTask } from "./tasks/ConcreteTask.js";

export class Cluster {
    private name: string = "";
    private tasks: ConcreteTask[] = [];

    constructor(name: string = "cluster") {
        this.name = name;
    }

    public addTask(task: ConcreteTask): boolean {
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

    public getName(): string {
        return this.name;
    }

    public getTasks(): ConcreteTask[] {
        return this.tasks;
    }

    public getCalls(): Call[] {
        return this.tasks.map(t => t.getCall()!);
    }

    public getTaskUniqueName(): string[] {
        return this.tasks.map(t => t.getUniqueName());
    }

    public hasTask(task: ConcreteTask): boolean {
        return this.tasks.some(t => t.getUniqueName() == task.getUniqueName());
    }

    public getInterfaceDataItems(): Record<string, DataItem[]> {
        const inOuts: Record<string, DataItem[]> = {};
        const taskNames = this.getTaskUniqueName();

        for (const task of this.tasks) {
            for (const comm of task.getIncomingComm()) {
                const sourceTaskName = comm.getSource().getUniqueName();
                const dataItemName = comm.getTargetData().getNameInInterface();

                if (!taskNames.includes(sourceTaskName)) {
                    const dataItem = comm.getTargetData();
                    if (inOuts[dataItemName] == undefined) {
                        inOuts[dataItemName] = [dataItem];
                    }
                    else {
                        inOuts[dataItemName].push(dataItem);
                    }
                }
            }
            for (const comm of task.getOutgoingComm()) {
                const targetTaskName = comm.getTarget().getUniqueName();
                const dataItemName = comm.getSourceData().getNameInInterface();

                if (!taskNames.includes(targetTaskName)) {
                    const dataItem = comm.getSourceData();
                    if (inOuts[dataItemName] == undefined) {
                        inOuts[dataItemName] = [dataItem];
                    }
                    else {
                        inOuts[dataItemName].push(dataItem);
                    }
                }
            }
        }
        return inOuts;
    }

    public getInOuts(): [string, ClusterInOut][] {
        const inOuts: [string, ClusterInOut][] = [];
        const iface = this.getInterfaceDataItems();

        for (const dataItemName in iface) {
            let isRead = false;
            let isWrite = false;

            for (const dataItem of iface[dataItemName]) {
                if (dataItem.isRead()) {
                    isRead = true;
                }
                if (dataItem.isWritten()) {
                    isWrite = true;
                }
            }
            const inOut = isRead && isWrite ? ClusterInOut.READ_WRITE : isRead ? ClusterInOut.READ : ClusterInOut.WRITE;
            inOuts.push([dataItemName, inOut]);
        }
        return inOuts;
    }

    public canAdd(task: ConcreteTask): boolean {
        return this.taskIsParallel(task) || this.taskIsValidAntecessor(task) || this.taskIsValidSuccessor(task);
    }

    // A task is parallel if it has no immediate antecedents or successors within the cluster
    private taskIsParallel(task: ConcreteTask): boolean {
        const noAntecessor = task.getIncomingComm().every(comm => !this.hasTask(comm.getSource() as ConcreteTask));
        const noSuccessor = task.getOutgoingComm().every(comm => !this.hasTask(comm.getTarget() as ConcreteTask));
        return noAntecessor && noSuccessor;
    }

    // a task is a valid antecessor if its immediate successors are either in the cluster, or never lead to the cluster
    private taskIsValidAntecessor(task: ConcreteTask): boolean {
        const successors = task.getOutgoingComm().map(comm => comm.getTarget() as ConcreteTask);
        for (const succ of successors) {
            if (this.hasTask(succ)) {
                continue;
            }
            // check if succ can lead to any task in the cluster
            const visited = new Set<string>();
            const stack = [succ];
            while (stack.length > 0) {
                const current = stack.pop()!;
                if (this.hasTask(current)) {
                    return false; // leads to a task in the cluster
                }
                visited.add(current.getUniqueName());
                const nextSuccessors = current.getOutgoingComm().map(comm => comm.getTarget() as ConcreteTask);
                for (const next of nextSuccessors) {
                    if (!visited.has(next.getUniqueName())) {
                        stack.push(next);
                    }
                }
            }
        }
        return true;
    }

    // a task is a valid successor if its immediate antecedents are either in the cluster, or never lead to the cluster
    private taskIsValidSuccessor(task: ConcreteTask): boolean {
        const antecedents = task.getIncomingComm().map(comm => comm.getSource() as ConcreteTask);
        for (const ant of antecedents) {
            if (this.hasTask(ant)) {
                continue;
            }
            // check if ant can lead to any task in the cluster
            const visited = new Set<string>();
            const stack = [ant];
            while (stack.length > 0) {
                const current = stack.pop()!;
                if (this.hasTask(current)) {
                    return false; // leads to a task in the cluster
                }
                visited.add(current.getUniqueName());
                const nextAntecedents = current.getIncomingComm().map(comm => comm.getSource() as ConcreteTask);
                for (const next of nextAntecedents) {
                    if (!visited.has(next.getUniqueName())) {
                        stack.push(next);
                    }
                }
            }
        }
        return true;
    }
}

export enum ClusterInOut {
    READ = "READ",
    WRITE = "WRITE",
    READ_WRITE = "READ_WRITE"
}