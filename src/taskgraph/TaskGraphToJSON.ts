import { DataItem } from "./dataitems/DataItem.js";
import { TaskGraph } from "./TaskGraph.js";
import { ConcreteTask } from "./tasks/ConcreteTask.js";
import { Task } from "./tasks/Task.js";

export class TaskGraphToJSON {
    constructor() { }

    public convert(etg: TaskGraph): TaskGraphJSON {
        const source = etg.getSourceTask();
        const sink = etg.getSinkTask();
        const globals = etg.getGlobalTask();
        const top = etg.getTopHierarchicalTask()!;

        const json: TaskGraphJSON = {
            source: this.convertTask(source),
            sink: this.convertTask(sink),
            globals: this.convertTask(globals),
        };
        if (top) {
            json.top = this.convertTask(top) as ConcreteTaskJSON;
        }

        return json;
    }

    protected convertTask(task: Task): TaskJSON {
        const json: TaskJSON = {
            name: task.getName(),
            type: task.getType().toString(),
            id: task.getId(),
            dataItems: task.getData().map(di => this.convertDataItem(di))
        };

        if (task instanceof ConcreteTask) {
            (json as ConcreteTaskJSON).call = task.getCall() ? task.getCall()!.signature : "N/A";
            (json as ConcreteTaskJSON).numTasks = 1;
            (json as ConcreteTaskJSON).childTasks = [];
        }
        return json;
    }

    protected convertDataItem(dataItem: DataItem): DataItemJSON {
        const json: DataItemJSON = {
            name: [dataItem.getNameInInterface(), dataItem.getNameInTask(), dataItem.getNameInPreviousTask()].join(":"),
            origin: dataItem.getItemOriginType().toString(),
            datatype: dataItem.getDatatype(),
            size: dataItem.getDatatypeSize(),
            isWritten: dataItem.isWritten(),
            isRead: dataItem.isRead(),
        };
        return json;
    }
}

export type TaskGraphJSON = {
    source: TaskJSON;
    sink: TaskJSON;
    globals: TaskJSON;
    top?: ConcreteTaskJSON;
};

export type TaskJSON = {
    name: string;
    type: string;
    id: string;
    dataItems: DataItemJSON[];
};

export type ConcreteTaskJSON = TaskJSON & {
    call: string;
    numTasks: number;
    childTasks: TaskJSON[];
};

export type DataItemJSON = {
    name: string;
    origin: string;
    datatype: string;
    size: number;
    isWritten: boolean;
    isRead: boolean;
}