import { Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import { DataItem } from "../DataItem.js";
import { DataItemOrigin } from "../DataItemOrigin.js";
import { Task } from "./Task.js";
import { TaskType } from "./TaskType.js";

export class SinkTask extends Task {
    private graphOutputData: DataItem[] = [];

    constructor() {
        super(TaskType.SINK);
        this.setId("TSink");
        this.setName("<task_graph_sink>");

    }

    public addDataToSink(dataItem: DataItem): DataItem {
        if (dataItem.getDecl() == null) {
            throw new Error("Data item cannot be null");
        }
        const vardecl = dataItem.getDecl() as Vardecl;
        const dataCopy = new DataItem(vardecl, DataItemOrigin.GRAPH_OUTPUT);
        this.graphOutputData.push(dataCopy);
        return dataCopy;
    }

    public getGraphOutputData(): DataItem[] {
        return this.graphOutputData;
    }

    public getData(): DataItem[] {
        const otherData = super.getData();  // always empty... in theory
        return [...otherData, ...this.graphOutputData];
    }
}