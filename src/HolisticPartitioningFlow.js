"use strict";

laraImport("UPTStage");
laraImport("OutputDirectories");
laraImport("taskgraph/TaskGraphManager");
laraImport("estimation/TaskGraphAnnotator");
laraImport("analysis/taskgraph/TaskGraphAnalyzer");
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
        const outDir = this.getOutputDir() + "/" + OutputDirectories.TASKGRAPH;

        const taskGraphMan = new TaskGraphManager(this.getTopFunction(), outDir, this.getAppName());
        const taskGraph = taskGraphMan.buildTaskGraph();
        taskGraphMan.dumpTaskGraph(taskGraph);

        this.log("Task graph successfully built!");
        return taskGraph;
    }

    annotateTaskGraph(taskGraph) {
        this.log("Running task graph annotation process");
        const estimDir = this.getOutputDir() + "/" + OutputDirectories.ESTIMATIONS;
        const inputDir = this.getOutputDir() + "/" + OutputDirectories.SRC_TASKS;

        const annotator = new TaskGraphAnnotator(this.getTopFunction(), estimDir, this.getAppName());
        annotator.annotateAll(taskGraph, this.#config, inputDir);
        annotator.dumpTaskGraph(taskGraph);

        this.log("Task graph successfully annotated with CPU/FPGA estimations!");
    }

    analyzeTaskGraph(taskGraph) {
        this.log("Running task graph analysis process");
        const outDir = this.getOutputDir() + "/" + OutputDirectories.TASKGRAPH;

        const analyzer = new TaskGraphAnalyzer(this.getTopFunction(), outDir, this.getAppName(), taskGraph);
        analyzer.updateMetrics();
        analyzer.saveMetrics();

        this.log(`Saved task graph metrics to file "${fname}"`);
    }
}