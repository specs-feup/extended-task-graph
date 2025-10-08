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
        return true;
    }
}

export enum ClusterInOut {
    READ = "READ",
    WRITE = "WRITE",
    READ_WRITE = "READ_WRITE"
}