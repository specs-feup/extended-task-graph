/* eslint-disable @typescript-eslint/no-explicit-any */
import { TaskGraph } from "../../taskgraph/TaskGraph.js";

export abstract class TaskGraphStat {
    protected statName: string;
    protected taskGraph: TaskGraph;

    constructor(statName: string, taskGraph: TaskGraph) {
        this.statName = statName;
        this.taskGraph = taskGraph;
    }

    public getStatName(): string {
        return this.statName;
    }

    public getTaskGraph(): TaskGraph {
        return this.taskGraph;
    }

    public abstract getStatSummary(): Record<string, any>;
}