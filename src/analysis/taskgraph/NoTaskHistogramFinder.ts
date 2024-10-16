import { TaskGraph } from "../../taskgraph/TaskGraph.js";
import { TaskGraphStat } from "./TaskGraphStat.js";

export class NoTaskHistogramFinder extends TaskGraphStat {
    constructor(taskGraph: TaskGraph) {
        super("noTaskCallsHistogram", taskGraph);
    }

    public getStatSummary(): Record<string, any> {
        const hist: Record<string, number> = {};

        for (const inlinable of this.taskGraph.getInlinables()) {
            const inlinableName = inlinable.name;

            if (inlinableName in hist) {
                hist[inlinableName]++;
            }
            else {
                hist[inlinableName] = 1;
            }
        }
        return hist;
    }
}