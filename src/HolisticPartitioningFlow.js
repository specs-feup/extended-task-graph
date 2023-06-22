"use strict";

laraImport("UPTStage");
laraImport("taskgraph/TaskGraphBuilder");
laraImport("util/ClavaUtils");

class HolisticPartitioningFlow extends UPTStage {
    #config;
    #topFunction;

    constructor(config) {
        super("HPFlow", config["outputDir"], config["appName"]);

        const topFun = config["starterFunction"];
        this.#topFunction = Query.search("function", { name: topFun }).first();
    }

    run() {
        this.log("Running holistic HW/SW partitioning flow");

        //const tg = this.buildTaskGraph();

        this.log("Holistic HW/SW partitioning flow finished successfully!");
    }

    buildTaskGraph() {
        this.log("Running task graph building process");
        const outDir = this.getOutputDir() + "/taskgraph";

        const tgBuilder = new TaskGraphBuilder(this.#topFunction, outDir, this.getAppName());
        const tg = tgBuilder.buildTaskGraph();
        tgBuilder.dumpTaskGraph(tg);

        return tg;
    }


}