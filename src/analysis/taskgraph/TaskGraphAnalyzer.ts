import { AStage } from "../../AStage.js";
import { TaskGraph } from "../../taskgraph/TaskGraph.js";
import { TaskGraphStatGatherer } from "./TaskGraphStatGatherer.js";
import { TaskPropertiesFinder } from "./TaskPropertiesFinder.js";

export class TaskGraphAnalyzer extends AStage {
    private taskGraph: TaskGraph;
    private metrics: Record<string, any> = {};

    constructor(topFunction: string, outputDir: string, appName: string, taskGraph: TaskGraph) {
        super("GenFlow-TaskGraphAnalyzer", topFunction, outputDir, appName);

        this.metrics["appName"] = appName;
        this.taskGraph = taskGraph;
    }

    public getMetrics(): Record<string, any> {
        return this.metrics;
    }

    public getMetricsAsJson(): string {
        return JSON.stringify(this.metrics, null, 4);
    }

    public saveMetrics(): void {
        const jsonMetrics = this.getMetricsAsJson();
        const fname = this.saveToFile(jsonMetrics, "task_graph_metrics.json");
        this.log(`Saved TG metrics to file "${fname}"`);
    }

    public updateMetrics(): Record<string, any> {
        const statCalculators: TaskGraphStatGatherer[] = [
            new TaskPropertiesFinder(this.taskGraph),  // Code properties of each task
            //new TaskGraphStatFinder(this.taskGraph),   // Statistics of the task graph
            //new NoTaskHistogramFinder(this.taskGraph), // Histogram of no-task function calls
            //new DataPerTaskFinder(this.taskGraph),     // Data per task
            //new GlobalDataFinder(this.taskGraph),      // Information about global data
            //new DataSourceFinder(this.taskGraph),      // Distance from a datum to its source
            //new DataPathFinder(this.taskGraph),        // Data paths in the task graph
            //new ParallelTaskFinder(),                   // Parallel tasks
            //new ProducerConsumerFinder(),               // Producer-consumer relationships
            //new CriticalPathFinder()                    // Critical path / ILP measure
        ];

        for (const statCalc of statCalculators) {
            const statName = statCalc.getStatName();
            this.metrics[statName] = statCalc.getStatSummary();
        }

        return this.metrics;
    }
}