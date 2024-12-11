import { TaskGraph } from "../../taskgraph/TaskGraph.js";
import { TaskGraphStat } from "./TaskGraphStat.js";

export class DataPerTaskFinder extends TaskGraphStat {
    constructor(taskGraph: TaskGraph) {
        super("dataPerTask", taskGraph);
    }

    public getStatSummary(): Record<string, unknown> {
        const dataPerTask: Record<string, unknown> = {};
        const tasks = this.taskGraph.getTasks();

        for (const task of tasks) {
            const taskData: Record<string, unknown> = {};

            for (const datum of task.getData()) {
                const datumProps = {
                    "origin": datum.getItemOriginType(),
                    "sizeInBytes": datum.getSizeInBytes(),
                    "cxxType": datum.getDatatype(),
                    "isScalar": datum.isScalar(),
                    "nameInInterface": datum.getNameInInterface(),
                    "nameInPrevTask": datum.getNameInPreviousTask(),
                    "stateChanges": {
                        "isInit": datum.isInitialized(),
                        "isWritten": datum.isWritten(),
                        "isRead": datum.isRead()
                    }
                }
                taskData[datum.getName()] = datumProps;
            }
            const taskName = task.getUniqueName();
            dataPerTask[taskName] = taskData;
        }
        return dataPerTask;
    }
}