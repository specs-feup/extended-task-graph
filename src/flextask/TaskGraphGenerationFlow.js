"use strict";

laraImport("flextask/AStage");
laraImport("flextask/OutputDirectories");
laraImport("flextask/taskgraph/TaskGraphManager");
laraImport("flextask/analysis/taskgraph/TaskGraphAnalyzer");
laraImport("flextask/util/ClavaUtils");

class TaskGraphGenerationFlow extends AStage {
    #config;

    constructor(config) {
        super("TGGFlow",
            config["starterFunction"],
            config["outputDir"],
            config["appName"]);
        this.#config = config;
    }

    run() {
        this.log("Running Task Graph Generation flow");

        const tg = this.buildTaskGraph();
        if (tg == null) {
            this.log("Task graph was not built successfully, aborting");
            return;
        }

        //this.annotateTaskGraph(tg);
        this.analyzeTaskGraph(tg);

        this.log("Task Graph Generation flow finished successfully!");
    }

    buildTaskGraph() {
        this.log("Running task graph building process");
        const topFun = this.getTopFunctionName();
        const outDir = this.getOutputDir() + "/" + OutputDirectories.TASKGRAPH;
        const appName = this.getAppName();

        const taskGraphMan = new TaskGraphManager(topFun, outDir, appName);
        const taskGraph = taskGraphMan.buildTaskGraph();

        if (taskGraph == null) {
            this.log("Cannot dump task graph, since it was not built successfully");
            return null;
        }
        else {
            taskGraphMan.dumpTaskGraph(taskGraph);

            this.log("Task graph successfully built!");
            return taskGraph;
        }
    }

    analyzeTaskGraph(taskGraph) {
        this.log("Running task graph analysis process");
        const topFun = this.getTopFunctionName();
        const outDir = this.getOutputDir() + "/" + OutputDirectories.TASKGRAPH;
        const appName = this.getAppName();

        const analyzer = new TaskGraphAnalyzer(topFun, outDir, appName, taskGraph);
        analyzer.updateMetrics();
        analyzer.saveMetrics();

        this.log("Task graph successfully analyzed!");
    }
}