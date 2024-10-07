import { Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import { DataItem } from "../DataItem.js";
import { DataItemOrigin } from "../DataItemOrigin.js";
import { Task } from "./Task.js";
import { TaskType } from "./TaskType.js";

export class SourceTask extends Task {
    #graphInputData: DataItem[] = [];

    constructor() {
        super(TaskType.SOURCE);
        this.setId("TSrc");
        this.setName("<task_graph_source>");
    }

    addDataToSource(dataItem: DataItem): DataItem {
        if (dataItem.getDecl() == null) {
            throw new Error("Data item cannot be null");
        }
        const vardecl = dataItem.getDecl() as Vardecl;
        const dataCopy = new DataItem(vardecl, DataItemOrigin.GRAPH_INPUT);
        this.#graphInputData.push(dataCopy);
        return dataCopy;
    }

    getGraphInputData(): DataItem[] {
        return this.#graphInputData;
    }

    getData(): DataItem[] {
        const otherData = super.getData();  // always empty... in theory
        return [...otherData, ...this.#graphInputData];
    }
}