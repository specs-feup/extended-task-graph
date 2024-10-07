"use strict";

laraImport("lara.util.IdGenerator");
laraImport("flextask/taskgraph/tasks/Task");
laraImport("flextask/taskgraph/tasks/TaskTypes");


class SourceTask extends Task {
    #graphInputData = [];

    constructor() {
        super(TaskTypes.GLOBAL);
        this.setId("TSrc");
        this.setName("<task_graph_source>");

    }

    addDataToSource(dataItem) {
        const dataCopy = new DataItem(dataItem.getDecl(), DataItemOrigins.GRAPH_INPUT);
        this.#graphInputData.push(dataCopy);
        return dataCopy;
    }

    getGraphInputData() {
        return this.#graphInputData;
    }

    getData() {
        const otherData = super.getData();  // always empty... in theory
        return [...otherData, ...this.#graphInputData];
    }
}