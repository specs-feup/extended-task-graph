import { TaskGraph } from "../../taskgraph/TaskGraph.js";
import { TaskType } from "../../taskgraph/tasks/TaskType.js";
import { TaskGraphStat } from "./TaskGraphStat.js";

export class TaskGraphStatFinder extends TaskGraphStat {
    constructor(taskGraph: TaskGraph) {
        super("taskGraphStats", taskGraph);
    }

    public getStatSummary(): Record<string, any> {
        const taskTypes: Record<string, TaskType> = {};
        let externalCnt = 0;
        let regularCnt = 0;

        const tasks = this.taskGraph.getTasks();
        for (const task of tasks) {
            const taskName = task.getName();
            const taskType = task.getType();
            taskTypes[taskName] = taskType;

            if (taskType === TaskType.EXTERNAL) {
                externalCnt++;
            }
            if (taskType === TaskType.REGULAR) {
                regularCnt++;
            }
        }

        const nTasks = regularCnt + externalCnt;
        const nEdges = this.taskGraph.getCommunications().length;
        const nInlinables = this.taskGraph.getInlinables().length;
        const nGlobals = this.taskGraph.getGlobalTask().getData().length;

        const result: Record<string, any> = {};
        result["counts"] = {
            "#tasks": nTasks,
            "#edges": nEdges,
            "externalTasks": externalCnt,
            "regularTasks": regularCnt,
            "inlinableCalls": nInlinables,
            "globalVars": nGlobals,

        };
        result["uniqueTaskTypes"] = taskTypes;

        return result;
    }
}