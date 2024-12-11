import { DataItem } from "./dataitems/DataItem.js";
import { Task } from "./tasks/Task.js";

export class Communication {
    private source: Task;
    private target: Task;
    private sourceData: DataItem;
    private targetData: DataItem;
    private rank: number = -1;

    constructor(source: Task, target: Task, sourceData: DataItem, targetData: DataItem, rank: number) {
        this.source = source;
        this.target = target;
        this.sourceData = sourceData;
        this.targetData = targetData;
        this.rank = rank;
    }

    public getSource(): Task {
        return this.source;
    }

    public getTarget(): Task {
        return this.target;
    }

    public setSource(source: Task): void {
        this.source = source;
    }

    public setTarget(target: Task): void {
        this.target = target;
    }

    public getSourceData(): DataItem {
        return this.sourceData;
    }

    public getTargetData(): DataItem {
        return this.targetData;
    }

    public getData(): [DataItem, DataItem] {
        return [this.sourceData, this.targetData];
    }

    public getRank(): number {
        return this.rank;
    }

    public toString(): string {
        if (this.sourceData == null || this.targetData == null) {
            let str = this.sourceData != null ? this.sourceData.getName() : "<undef>";
            str += this.targetData != null ? "/" + this.targetData.getName() : "/<undef>";

            return str;
        }
        const source = this.sourceData.getNameInTask();
        const target = this.targetData.getNameInTask();
        const iface = this.targetData.getNameInInterface();

        const str = `[${this.rank}]
${source}
(${iface})
${target}
{${this.sourceData.getSizeInBytes()}}`;
        return str;
    }
}