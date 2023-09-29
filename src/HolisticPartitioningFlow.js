"use strict";

laraImport("UPTStage");
laraImport("taskgraph/TaskGraphManager");
laraImport("estimation/TaskGraphAnnotator");
laraImport("util/ClavaUtils");

class HolisticPartitioningFlow extends UPTStage {
    #config;

    constructor(config) {
        super("HPFlow",
            config["starterFunction"],
            config["outputDir"],
            config["appName"]);
        this.#config = config;
    }

    run() {
        this.log("Running holistic HW/SW partitioning flow");

        const tg = this.buildTaskGraph();
        this.annotateTaskGraph(tg);

        this.log("Holistic HW/SW partitioning flow finished successfully!");
    }

    buildTaskGraph() {
        this.log("Running task graph building process");
        const outDir = this.getOutputDir() + "/taskgraph";

        const tgMan = new TaskGraphManager(this.getTopFunction(), outDir, this.getAppName());
        const tg = tgMan.buildTaskGraph();
        tgMan.dumpTaskGraph(tg);
        tgMan.saveMetrics(tg);

        this.log("Task graph successfully built!");
        return tg;
    }

    annotateTaskGraph(tg) {
        this.log("Running task graph annotation process");
        const estimDir = this.getOutputDir() + "/estimations";

        const annotator = new TaskGraphAnnotator(this.getTopFunction(), estimDir, this.getAppName());
        annotator.annotateCpuEstimations(tg, "none");
        annotator.annotateFpgaEstimations(tg, "none");

        this.log("Task graph successfully annotated with CPU/FPGA estimations!");
    }
}