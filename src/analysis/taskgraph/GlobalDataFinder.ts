import { TaskGraph } from "../../taskgraph/TaskGraph.js";
import { TaskGraphStat } from "./TaskGraphStat.js";

export class GlobalDataFinder extends TaskGraphStat {
    constructor(taskGraph: TaskGraph) {
        super("globalData", taskGraph);
    }

    public getStatSummary(): Record<string, any> {
        const globalData: Record<string, any> = {};
        const globalTask = this.taskGraph.getGlobalTask();

        for (const datum of globalTask.getData()) {
            const outgoing = globalTask.getOutgoingOfData(datum);

            if (outgoing.length > 0) {
                const datumProps = {
                    "origin": datum.getItemOriginType(),
                    "sizeInBytes": datum.getSizeInBytes(),
                    "cxxType": datum.getDatatype(),
                    "isScalar": datum.isScalar(),
                    "alternateName": datum.getAlternateName(),
                    "stateChanges": {
                        "isInit": datum.isInitialized(),
                        "isWritten": datum.isWritten(),
                        "isRead": datum.isRead()
                    }
                }
                globalData[datum.getName()] = datumProps;
            }
        }
        return globalData;
    }

}