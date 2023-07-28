"use strict";

laraImport("taskgraph/TaskGraph");
laraImport("taskgraph/Task");
laraImport("taskgraph/Communication");

class TaskGraphDumper {
    constructor() { }

    dump(taskGraph) {
        let dot = "digraph G {\n";
        dot += "\trankdir=TB;\n";
        dot += "\tnode [shape=box];\n";

        dot += `\t${taskGraph.getSource().getId()} [label=\"main_begin\"];\n`;
        dot += `\t${taskGraph.getSink().getId()} [label=\"main_end\"];\n`;

        const topHierTask = taskGraph.getTopHierarchicalTask();
        dot += this.#getDotOfCluster(topHierTask);

        dot += "\n";
        dot += this.#getDotOfCommunications(taskGraph);

        dot += "}";
        return dot;
    }

    #getDotOfCluster(task) {
        let dot = "";
        if (task.getHierarchicalChildren().length > 0) {
            dot += `\tsubgraph cluster_${task.getId()} {\n`;
            dot += `\tlabel = "${this.#getLabelOfTask(task)}";\n`;

            dot += `\t${task.getId()}_src [shape=circle, label=""];\n`;
            dot += `\t${task.getId()}_target [shape=circle, label=""];\n`;

            for (const child of task.getHierarchicalChildren()) {
                dot += this.#getDotOfCluster(child);
            }
            dot += "\t}\n";
        }
        else {
            dot += `\t${task.getId()} [label="${this.#getLabelOfTask(task)}"];\n`;
        }
        return dot;
    }

    #getLabelOfTask(task) {
        let label = `${task.getId()}: ${task.getFunction().name}\n`;

        label += "Ref:\n";
        const refData = [];
        for (const data of task.getReferencedData()) {
            refData.push(data.toString());
        }
        label += refData.join("\n");

        const newData = [];
        for (const data of task.getDataCreatedHere()) {
            newData.push(data.toString());
        }
        label += "\nNew: " + newData.join("\n");

        return label;
    }

    #getDotOfCommunications(taskGraph) {
        let dot = "";
        for (const comm of taskGraph.getCommunications()) {
            const source = comm.getSource();
            const target = comm.getTarget();
            const sourceHasHierChildren = source.getHierarchicalChildren().length > 0;
            const targetHasHierChildren = target.getHierarchicalChildren().length > 0;

            if (target.getHierarchicalParent() !== source) {
                if (sourceHasHierChildren && targetHasHierChildren) {
                    dot += `\t${source.getId()}_target -> ${target.getId()}_src [label="${comm.toString()}"];\n`;
                }
                if (sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t${source.getId()}_target -> ${target.getId()} [label="${comm.toString()}"];\n`;
                }
                if (!sourceHasHierChildren && targetHasHierChildren) {
                    dot += `\t${source.getId()} -> ${target.getId()}_src [label="${comm.toString()}"];\n`;
                }
                if (!sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t${source.getId()} -> ${target.getId()} [label="${comm.toString()}"];\n`;
                }
            }
            else {
                if (sourceHasHierChildren && targetHasHierChildren) {
                    dot += `\t${source.getId()}_src -> ${target.getId()}_src [label="${comm.toString()}"];\n`;
                }
                if (sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t${source.getId()}_src -> ${target.getId()} [label="${comm.toString()}"];\n`;
                }
                if (!sourceHasHierChildren && targetHasHierChildren) {
                    dot += `\t${source.getId()} -> ${target.getId()}_src [label="${comm.toString()}"];\n`;
                }
                if (!sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t${source.getId()} -> ${target.getId()} [label="${comm.toString()}"];\n`;
                }
            }
        }
        return dot;
    }
}