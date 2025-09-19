import { TaskGraph } from "./TaskGraph.js";
import { ConcreteTask } from "./tasks/ConcreteTask.js";
import { Task } from "./tasks/Task.js";

export class TaskGraphToJSON {
    constructor() { }

    public convert(etg: TaskGraph): object {
        const json: any = {};

        const source = etg.getSourceTask();
        const sink = etg.getSinkTask();
        const globals = etg.getGlobalTask();
        const top = etg.getTopHierarchicalTask();

        json["source"] = {
            id: source.getId(),
            name: source.getName()
        };
        json["sink"] = {
            id: sink.getId(),
            name: sink.getName()
        };
        json["globals"] = {
            id: globals.getId(),
            name: globals.getName()
        };

        if (top != null) {
            json["top"] = this.convertTask(top);
        }
        else {
            console.log("[TaskGraphToJSON] No top hierarchical task found, cannot convert to JSON.");
        }

        return json;
    }

    protected convertTask(task: ConcreteTask): object {
        const json: any = {};
        json["name"] = task.getName();
        json["type"] = task.getType();
        json["call"] = task.getCall() ? task.getCall()?.signature : "N/A";
        json["id"] = task.getId();
        json["numTasks"] = task.getHierarchicalChildren().length;
        json["childTasks"] = [];
        for (const childTask of task.getHierarchicalChildren()) {
            const childJson = this.convertTask(childTask);
            json["childTasks"].push(childJson);
        }
        return json;
    }
}