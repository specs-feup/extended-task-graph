import { Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import { DataItem } from "../dataitems/DataItem.js";
import { DataItemOrigin } from "../DataItemOrigin.js";
import { Task } from "./Task.js";
import { TaskType } from "./TaskType.js";
import { VariableDataItem } from "../dataitems/VariableDataItem.js";

export class SourceTask extends Task {
    private graphInputData: VariableDataItem[] = [];

    constructor() {
        super(TaskType.SOURCE);
        this.setId("TSrc");
        this.setName("<task_graph_source>");
    }

    public addDataToSource(dataItem: VariableDataItem): VariableDataItem {
        const vardecl = dataItem.getDecl() as Vardecl;
        const dataCopy = new VariableDataItem(vardecl, DataItemOrigin.GRAPH_INPUT);
        this.graphInputData.push(dataCopy);
        return dataCopy;
    }

    public getGraphInputData(): DataItem[] {
        return this.graphInputData;
    }

    public getData(): DataItem[] {
        const otherData = super.getData();  // always empty... in theory
        return [...otherData, ...this.graphInputData];
    }
}