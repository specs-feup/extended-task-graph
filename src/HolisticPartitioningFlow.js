"use strict";

laraImport("UPTStage");
laraImport("taskgraph/TaskGraphBuilder");
laraImport("util/ClavaUtils");

class HolisticPartitioningFlow extends UPTStage {
    #config;

    constructor(config) {
        super("HPFlow",
            config["starterFunction"],
            config["outputDir"],
            config["appName"]);
    }

    run() {
        this.log("Running holistic HW/SW partitioning flow");

        //const tg = this.buildTaskGraph();

        this.log("Holistic HW/SW partitioning flow finished successfully!");
    }

    buildTaskGraph() {
        this.log("Running task graph building process");
        const outDir = this.getOutputDir() + "/taskgraph";

        const tgBuilder = new TaskGraphBuilder(this.getTopFunction(), outDir, this.getAppName());
        const tg = tgBuilder.buildTaskGraph();
        tgBuilder.dumpTaskGraph(tg);

        return tg;
    }


}