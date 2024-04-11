"use strict";

laraImport("flextask/AStage");
laraImport("flextask/OutputDirectories");
laraImport("flextask/taskgraph/TaskGraphBuilder");
laraImport("flextask/taskgraph/TaskGraphDotConverter");
laraImport("flextask/analysis/taskgraph/TaskGraphAnalyzer");
laraImport("flextask/util/ClavaUtils");

class TaskGraphGenerationFlow extends AStage {
    constructor(topFunctionName, outputDir, appName) {
        super("TGGFlow", topFunctionName, outputDir, appName);
    }

    run(dumpGraph = true, gatherMetrics = true) {
        this.log("Running Task Graph Generation flow");

        const tg = this.buildTaskGraph();
        if (tg == null) {
            this.warn("Task graph was not built successfully, aborting");
            return null;
        }

        if (dumpGraph) {
            this.dumpTaskGraph(tg);
        }

        if (gatherMetrics) {
            //this.analyzeTaskGraph(tg);
        }

        this.log("Task Graph Generation flow finished successfully!");
        return tg;
    }

    buildTaskGraph() {
        this.log("Running task graph building process");
        const topFun = this.getTopFunctionName();
        const outDir = this.getOutputDir() + "/" + OutputDirectories.TASKGRAPH;
        const appName = this.getAppName();

        const builder = new TaskGraphBuilder(topFun, outDir, appName);
        const taskGraph = builder.build();
        return taskGraph;
    }

    dumpTaskGraph(taskGraph) {
        this.log("Running task graph dumping process");
        const conv = new TaskGraphDotConverter();

        const dotVerbose = conv.convert(taskGraph);
        const fname1 = this.saveToFileInSubfolder(dotVerbose, "taskgraph.dot", OutputDirectories.TASKGRAPH);
        this.logOutput("Dumped full task graph to", fname1);

        const dotMinimal = conv.convertMinimal(taskGraph);
        const fname2 = this.saveToFileInSubfolder(dotMinimal, "taskgraph_min.dot", OutputDirectories.TASKGRAPH);
        this.logOutput("Dumped mini task graph to", fname2);

        this.log("Task graph successfully dumped!");
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