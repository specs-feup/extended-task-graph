"use strict";

laraImport("lara.util.IdGenerator");
laraImport("flextask/taskgraph/tasks/Task");
laraImport("flextask/taskgraph/tasks/TaskTypes");


class SinkTask extends Task {
    #graphOutputData = [];

    constructor() {
        super(TaskTypes.GLOBAL);
        this.setId("TSink");
        this.setName("<task_graph_sink>");

    }

    addDataToSink(dataItem) {
        const dataCopy = new DataItem(dataItem.getDecl(), DataItemOrigins.GRAPH_OUTPUT);
        this.#graphOutputData.push(dataCopy);
        return dataCopy;
    }

    getGraphOutputData() {
        return this.#graphOutputData;
    }

    getData() {
        const otherData = super.getData();  // always empty... in theory
        return [...otherData, ...this.#graphOutputData];
    }
}