"use strict";

laraImport("taskgraph/TaskGraph");
laraImport("weaver.Query");

class TaskGraphMetricsAggregator {
    #taskGraph;
    #metrics = {};

    constructor(appName, taskGraph) {
        this.#metrics["appName"] = appName;
        this.#taskGraph = taskGraph;
    }

    updateMetrics() {

    }


    getMetrics() {
        return this.#metrics;
    }

    getMetricsAsJson() {
        return JSON.stringify(this.#metrics);
    }
}