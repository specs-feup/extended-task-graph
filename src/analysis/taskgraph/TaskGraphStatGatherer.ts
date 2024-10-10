import { TaskGraph } from "../../taskgraph/TaskGraph.js";

export abstract class TaskGraphStatGatherer {
    #statName: string;
    #taskGraph: TaskGraph;

    constructor(statName: string, taskGraph: TaskGraph) {
        this.#statName = statName;
        this.#taskGraph = taskGraph;
    }

    getStatName(): string {
        return this.#statName;
    }

    getTaskGraph(): TaskGraph {
        return this.#taskGraph;
    }

    abstract getStatSummary(): Record<string, any>;
}