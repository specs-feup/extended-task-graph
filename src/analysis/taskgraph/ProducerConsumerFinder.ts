import { Communication } from "../../taskgraph/Communication.js";
import { TaskGraph } from "../../taskgraph/TaskGraph.js";
import { ConcreteTask } from "../../taskgraph/tasks/ConcreteTask.js";
import { TaskGraphStat } from "./TaskGraphStat.js";

export class ProducerConsumerFinder extends TaskGraphStat {
    constructor(taskGraph: TaskGraph) {
        super("producerConsumer", taskGraph);
    }

    public getStatSummary(): Record<string, any> {
        const pairs = this.findTaskPairs();
        const mapping = this.getPairToProducerConsumerMap(pairs);
        return mapping;
    }

    private findTaskPairs(): ConcreteTask[][] {
        const pairs: ConcreteTask[][] = [];

        for (const task of this.taskGraph.getTasks()) {
            const children = task.getHierarchicalChildren();

            // we can only have pairs if we have at least 2 children
            if (children.length >= 2) {

                // get all pairs where TX -> TY
                for (let i = 0; i < children.length; i++) {
                    for (let j = i + 1; j < children.length; j++) {
                        const t1 = children[i];
                        const t2 = children[j];

                        if (this.taskIsDirectChild(t1, t2)) {
                            pairs.push([t1, t2]);
                        }
                    }
                }
            }
        }
        return pairs;
    }

    // consider having a getChildren/getParents method in Task
    private taskIsDirectChild(task1: ConcreteTask, task2: ConcreteTask): boolean {
        const t1comm = task1.getOutgoingComm();

        for (const comm of t1comm) {
            if (comm.getTarget().getId() === task2.getId()) {
                return true;
            }
        }
        return false;
    }

    hasPCRelationship(task1: ConcreteTask, task2: ConcreteTask): Communication[] {
        const commonData: Communication[] = [];
        const t1comm = task1.getOutgoingComm();

        // only consider pair if all comm from T1 goes to T2, with W -> R
        // not really sure what to do in other cases
        for (const comm of t1comm) {
            const target = comm.getTarget();

            if (target.getId() === task2.getId()) {
                const parentData = comm.getSourceData();
                const childData = comm.getTargetData();

                if (parentData.isWritten() && childData.isRead()) {
                    commonData.push(comm);
                }
            }
        }
        return commonData;
    }

    getPairToProducerConsumerMap(taskPairs: ConcreteTask[][]) {
        const mapping = [];

        for (const pair of taskPairs) {
            const commonData = this.hasPCRelationship(pair[0], pair[1]);
            const hasPC = commonData.length > 0;

            if (!hasPC) {
                continue;
            }

            const dataNames = commonData.map(comm => comm.getSourceData().getName());
            const firstTaskName = pair[0].getId() + " : " + pair[0].getName();
            const secondTaskName = pair[1].getId() + " : " + pair[1].getName();
            const parentHier = pair[0].getHierarchicalParent();
            const hierParentName = parentHier == null ?
                "<null_id>:<null_name>" :
                `${parentHier.getId()}:${parentHier.getName()}`;

            const map = {
                "pair": [firstTaskName, secondTaskName],
                "commonData": dataNames,
                "hierarchicalParent": hierParentName
            };
            mapping.push(map);
        }
        return mapping;
    }
}