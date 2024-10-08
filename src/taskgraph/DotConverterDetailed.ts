import { DotConverter } from "./DotConverter.js";
import { Task } from "./tasks/Task.js";

export class DotConverterDetailed extends DotConverter {

    constructor() {
        super();
    }

    getLabelOfTask(task: Task): string {
        let label = super.getLabelOfTask(task);

        if (task.getParamData().length > 0) {
            label += "\n\n[Param data]\n";
            const refData = [];
            for (const data of task.getParamData()) {
                refData.push(data.toString());
            }
            label += refData.join("\n");
        }

        if (task.getGlobalRefData().length > 0) {
            label += "\n\n[Global data]\n";
            const globalData = [];
            for (const data of task.getGlobalRefData()) {
                globalData.push(data.toString());
            }
            label += globalData.join("\n");
        }

        if (task.getNewData().length > 0) {
            label += "\n\n[New data]\n";
            const newData = [];
            for (const data of task.getNewData()) {
                newData.push(data.toString());
            }
            label += newData.join("\n");
        }

        return label;
    }
}