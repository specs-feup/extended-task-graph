"use strict";

laraImport("UPTStage");
laraImport("taskgraph/TaskGraphBuilder");
laraImport("util/ClavaUtils");

class HolisticPartitioningFlow extends UPTStage {
    #config;

    constructor(config) {
        super("HPFlow", config["outputDir"], config["appName"]);
        this.#config = config;
    }

    run() {
        this.log("Running holistic HW/SW partitioning flow");

        const tg = this.buildTaskGraph();

        this.log("Holistic HW/SW partitioning flow finished successfully!");
    }

    buildTaskGraph() {
        this.log("Running task graph building process");
        const tgBuilder = new TaskGraphBuilder(this.getOutputDir(), this.getAppName());
        const tg = tgBuilder.buildTaskGraph();

        return tg;
    }


}