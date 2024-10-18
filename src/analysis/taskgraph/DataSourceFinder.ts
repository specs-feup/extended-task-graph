import { DataItem } from "../../taskgraph/dataitems/DataItem.js";
import { TaskGraph } from "../../taskgraph/TaskGraph.js";
import { Task } from "../../taskgraph/tasks/Task.js";
import { TaskType } from "../../taskgraph/tasks/TaskType.js";
import { TaskGraphStat } from "./TaskGraphStat.js";

export class DataSourceFinder extends TaskGraphStat {
    constructor(taskGraph: TaskGraph) {
        super("dataSourceDistance", taskGraph);
    }

    public getStatSummary(): Record<string, any> {
        const dataSourceDistance: Record<string, any> = {};
        const tasks = this.taskGraph.getTasks();

        for (const task of tasks) {
            const commOfTask: Record<string, any> = {};

            for (const datum of task.getData()) {
                const pathAndEvo = this.calculateDistanceToOrigin(datum, task);
                const path = pathAndEvo[0];
                const dataEvo = pathAndEvo[1];
                commOfTask[datum.getName()] = { "pathToOrigin": path, "dataEvolution": dataEvo, "distanceToOrigin": path.length };
            }
            const taskName = task.getUniqueName();
            dataSourceDistance[taskName] = commOfTask;
        }
        return dataSourceDistance;
    }

    private calculateDistanceToOrigin(datum: DataItem, task: Task): [string[], string[]] {
        const path = [task.getUniqueName()];
        const dataEvo = [datum.getName()];

        if (task.getType() === TaskType.GLOBALSOURCE || task.getType() === TaskType.SOURCE) {
            return [path, dataEvo];
        }
        if (datum.isNewlyCreated() || datum.isConstant()) {
            return [path, dataEvo];
        }
        else {
            const comm = task.getIncomingOfData(datum);
            if (comm == null) {
                console.log(`[DataSourceFinder] ERROR: No incoming communication found for data ${datum.getName()} of task ${task.getUniqueName()}`);
                return [path, dataEvo];
            }
            else {
                const srcTask = comm.getSource();
                const srcDatum = comm.getSourceData();

                const remaining = this.calculateDistanceToOrigin(srcDatum, srcTask);
                const remainingPath = remaining[0];
                const remainingDataEvo = remaining[1];

                path.push(...remainingPath);
                dataEvo.push(...remainingDataEvo);
                return [path, dataEvo];
            }
        }
    }
}