import { AStage } from "../AStage.js";
import { DotConverter } from "../taskgraph/DotConverter.js";
import { DotConverterDetailed } from "../taskgraph/DotConverterDetailed.js";
import { DotConverterMinimal } from "../taskgraph/DotConverterMinimal.js";
import { TaskGraph } from "../taskgraph/TaskGraph.js";
import { TaskGraphBuilder } from "../taskgraph/TaskGraphBuilder.js";
import { TaskGraphAnalyzer } from "../analysis/taskgraph/TaskGraphAnalyzer.js";
import { TaskGraphOutput } from "./OutputDirectories.js";
import { GenFlowConfig } from "./GenFlowConfig.js";

export class TaskGraphGenerationFlow extends AStage {
    constructor(topFunctionName: string, outputDir: string, appName: string) {
        super("GenFlow", topFunctionName, outputDir, appName);
    }

    public runAll(config: GenFlowConfig): TaskGraph | null {
        this.logStart();
        this.log("Running Extended Task Graph Generation flow");

        const tg = this.buildTaskGraph();
        if (tg == null) {
            this.logWarning("Task graph was not built successfully, aborting");
            return null;
        }

        if (config.dumpGraph) {
            this.dumpTaskGraph(tg);
        }

        if (config.gatherMetrics) {
            this.analyzeTaskGraph(tg);
        }

        this.log("Task Graph Generation flow finished successfully!");
        this.logEnd();
        return tg;
    }

    public buildTaskGraph(subfolder: string = TaskGraphOutput.ETG_DEFAULT): TaskGraph | null {
        if (subfolder != TaskGraphOutput.ETG_DEFAULT) {
            subfolder = `${TaskGraphOutput.ETG_PARENT}/${subfolder}`;
        }
        else {
            subfolder = `${TaskGraphOutput.ETG_PARENT}/${TaskGraphOutput.ETG_DEFAULT}`;
        }

        this.log("Running task graph building process");
        const topFun = this.getTopFunctionName();
        const outDir = `${this.getOutputDir()}/${subfolder}`;
        const appName = this.getAppName();

        const builder = new TaskGraphBuilder(topFun, outDir, appName);
        const taskGraph = builder.build();
        return taskGraph;
    }

    public dumpTaskGraph(taskGraph: TaskGraph, subfolder: string = TaskGraphOutput.ETG_DEFAULT): void {
        if (subfolder != TaskGraphOutput.ETG_DEFAULT) {
            subfolder = `${TaskGraphOutput.ETG_PARENT}/${subfolder}`;
        }
        else {
            subfolder = `${TaskGraphOutput.ETG_PARENT}/${TaskGraphOutput.ETG_DEFAULT}`;
        }

        this.log("Running task graph dumping process");

        const conv1 = new DotConverter();
        const dotNormal = conv1.convert(taskGraph);
        const fname1 = this.saveToFileInSubfolder(dotNormal, "taskgraph.dot", subfolder);
        this.logOutput("Dumped regular task graph to", fname1);

        const conv2 = new DotConverterMinimal();
        const dotMinimal = conv2.convert(taskGraph);
        const fname2 = this.saveToFileInSubfolder(dotMinimal, "taskgraph_min.dot", subfolder);
        this.logOutput("Dumped mini task graph to", fname2);

        const conv3 = new DotConverterDetailed();
        const dotDetailed = conv3.convert(taskGraph);
        const fname3 = this.saveToFileInSubfolder(dotDetailed, "taskgraph_det.dot", subfolder);
        this.logOutput("Dumped detailed task graph to", fname3);

        this.log("Task graph successfully dumped!");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public analyzeTaskGraph(taskGraph: TaskGraph, subfolder: string = TaskGraphOutput.ETG_DEFAULT): Record<string, any> {
        if (subfolder != TaskGraphOutput.ETG_DEFAULT) {
            subfolder = `${TaskGraphOutput.ETG_PARENT}/${subfolder}`;
        }
        else {
            subfolder = `${TaskGraphOutput.ETG_PARENT}/${TaskGraphOutput.ETG_DEFAULT}`;
        }

        this.log("Running task graph analysis process");
        const topFun = this.getTopFunctionName();
        const outDir = `${this.getOutputDir()}/${subfolder}`;
        const appName = this.getAppName();

        const analyzer = new TaskGraphAnalyzer(topFun, outDir, appName, taskGraph);
        const metrics = analyzer.updateMetrics();
        analyzer.saveMetrics();

        this.log("Task graph successfully analyzed!");
        return metrics;
    }
}