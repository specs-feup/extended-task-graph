/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataItem } from "../../taskgraph/dataitems/DataItem.js";
import { TaskGraph } from "../../taskgraph/TaskGraph.js";
import { GlobalTask } from "../../taskgraph/tasks/GlobalTask.js";
import { Task } from "../../taskgraph/tasks/Task.js";
import { TaskType } from "../../taskgraph/tasks/TaskType.js";
import { TaskGraphStat } from "./TaskGraphStat.js";

export class DataPathFinder extends TaskGraphStat {
    constructor(taskGraph: TaskGraph) {
        super("dataPaths", taskGraph);
    }

    public getStatSummary(): Record<string, any> {
        const itemsAndTasks = this.getNewDataItems();
        const dataPaths: Record<string, any> = {};

        for (const itemAndTask of itemsAndTasks) {
            const dataItem = itemAndTask.item;
            const task = itemAndTask.task;

            const paths = this.findDataPath(dataItem, task);
            dataPaths[dataItem.getName()] = {
                "datatype": dataItem.getDatatype(),
                "sizeInBytes": dataItem.getSizeInBytes(),
                "mainPath": paths.mainPath,
                "mainPathLength": paths.mainPath.length,
                "spurs": paths.spurs,
                "#spurs": paths.spurs.length,
                "aliases": [...paths.aliases],
                "#aliases": paths.aliases.size
            };
        }
        return dataPaths;
    }

    private getNewDataItems(): { "item": DataItem, "task": Task }[] {
        const itemsAndTasks = [];
        const tasks = [...this.taskGraph.getTasks(), this.taskGraph.getSourceTask(), this.taskGraph.getSinkTask(), this.taskGraph.getGlobalTask()];

        for (const task of tasks) {
            if (task.getType() == TaskType.SOURCE || task.getType() == TaskType.REGULAR || task.getType() == TaskType.EXTERNAL) {
                for (const dataItem of task.getNewData()) {
                    itemsAndTasks.push({ "item": dataItem, "task": task });
                }
            }
            if (task.getType() == TaskType.GLOBALSOURCE) {
                const globalTask = task as GlobalTask;
                for (const dataItem of globalTask.getGlobalDeclData()) {
                    itemsAndTasks.push({ "item": dataItem, "task": task });
                }
            }
        }
        return itemsAndTasks;
    }

    private findDataPath(dataItem: DataItem, task: Task): { "mainPath": string[], "spurs": string[], "aliases": Set<string> } {
        const mainPath = [task.getName()];
        const spurs = [];
        const aliases: Set<string> = new Set();
        aliases.add(dataItem.getName());

        for (const comm of task.getOutgoingOfData(dataItem)) {
            const targetTask = comm.getTarget();
            const targetDataItem = comm.getTargetData();
            aliases.add(targetDataItem.getName());

            if (targetDataItem.isOnlyRead()) {
                spurs.push(targetTask.getName());
            }
            if (targetDataItem.isWritten()) {
                const paths = this.findDataPath(targetDataItem, targetTask);
                mainPath.push(...paths.mainPath);
                spurs.push(...paths.spurs);
                paths.aliases.forEach(alias => aliases.add(alias));
            }
        }
        return { "mainPath": mainPath, "spurs": spurs, "aliases": aliases };
    }
}