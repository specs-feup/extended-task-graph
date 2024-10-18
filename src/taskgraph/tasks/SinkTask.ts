import { Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import { DataItem } from "../dataitems/DataItem.js";
import { DataItemOrigin } from "../DataItemOrigin.js";
import { Task } from "./Task.js";
import { TaskType } from "./TaskType.js";
import { VariableDataItem } from "../dataitems/VariableDataItem.js";

export class SinkTask extends Task {
    private graphOutputData: VariableDataItem[] = [];

    constructor() {
        super(TaskType.SINK);
        this.setId("TSink");
        this.setName("<task_graph_sink>");

    }

    public addDataToSink(dataItem: VariableDataItem): VariableDataItem {
        const vardecl = dataItem.getDecl() as Vardecl;
        const dataCopy = new VariableDataItem(vardecl, DataItemOrigin.GRAPH_OUTPUT);
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