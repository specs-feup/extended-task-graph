import { AStage } from "./AStage.js";
import { OutputDirectories } from "./OutputDirectories.js";
import { DotConverter } from "./taskgraph/DotConverter.js";
import { DotConverterDetailed } from "./taskgraph/DotConverterDetailed.js";
import { DotConverterMinimal } from "./taskgraph/DotConverterMinimal.js";
import { TaskGraph } from "./taskgraph/TaskGraph.js";
import { TaskGraphBuilder } from "./taskgraph/TaskGraphBuilder.js";

export class TaskGraphGenerationFlow extends AStage {
    constructor(topFunctionName: string, outputDir: string, appName: string) {
        super("TGGFlow", topFunctionName, outputDir, appName);
    }

    run(dumpGraph = true, gatherMetrics = true): TaskGraph | null {
        this.logStart();
        this.log("Running Task Graph Generation flow");

        const tg = this.buildTaskGraph();
        if (tg == null) {
            this.logWarning("Task graph was not built successfully, aborting");
            return null;
        }

        if (dumpGraph) {
            this.dumpTaskGraph(tg);
        }

        if (gatherMetrics) {
            //this.analyzeTaskGraph(tg);
        }

        this.log("Task Graph Generation flow finished successfully!");
        this.logEnd();
        return tg;
    }

    buildTaskGraph(): TaskGraph | null {
        this.log("Running task graph building process");
        const topFun = this.getTopFunctionName();
        const outDir = this.getOutputDir() + "/" + OutputDirectories.TASKGRAPH;
        const appName = this.getAppName();

        const builder = new TaskGraphBuilder(topFun, outDir, appName);
        const taskGraph = builder.build();
        return taskGraph;
    }

    dumpTaskGraph(taskGraph: TaskGraph): void {
        this.log("Running task graph dumping process");

        const conv1 = new DotConverter();
        const dotNormal = conv1.convert(taskGraph);
        const fname1 = this.saveToFileInSubfolder(dotNormal, "taskgraph.dot", OutputDirectories.TASKGRAPH);
        this.logOutput("Dumped regular task graph to", fname1);

        const conv2 = new DotConverterMinimal();
        const dotMinimal = conv2.convert(taskGraph);
        const fname2 = this.saveToFileInSubfolder(dotMinimal, "taskgraph_min.dot", OutputDirectories.TASKGRAPH);
        this.logOutput("Dumped mini task graph to", fname2);

        const conv3 = new DotConverterDetailed();
        const dotDetailed = conv3.convert(taskGraph);
        const fname3 = this.saveToFileInSubfolder(dotDetailed, "taskgraph_det.dot", OutputDirectories.TASKGRAPH);
        this.logOutput("Dumped detailed task graph to", fname3);

        this.log("Task graph successfully dumped!");
    }

    analyzeTaskGraph(taskGraph: TaskGraph): void {
        this.log("Running task graph analysis process");
        const topFun = this.getTopFunctionName();
        const outDir = this.getOutputDir() + "/" + OutputDirectories.TASKGRAPH;
        const appName = this.getAppName();

        // const analyzer = new TaskGraphAnalyzer(topFun, outDir, appName, taskGraph);
        // analyzer.updateMetrics();
        // analyzer.saveMetrics();

        this.log("Task graph successfully analyzed!");
    }
}