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

        dot += "\tTStart [label=\"main_begin\"];\n";
        dot += "\tTEnd [label=\"main_begin\"];\n";

        const topHierTask = taskGraph.getTopHierarchicalTask();
        dot += this.#getDotOfCluster(topHierTask);

        dot += "}";
        return dot;
    }

    #getDotOfCluster(task) {
        let dot = "";
        if (task.getHierarchicalChildren().length > 0) {
            dot += `\tsubgraph cluster_${task.getId()} {\n`;
            dot += `\tlabel = "${this.#getLabelOfTask(task)}";\n`;

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
        let label = task.getId() + "\nRef: ";

        const refData = [];
        for (const data of task.getReferencedData()) {
            refData.push(data.toString());
        }
        label += refData.join(", ");

        const newData = [];
        for (const data of task.getDataCreatedHere()) {
            newData.push(data.toString());
        }
        label += "\nNew: " + newData.join(", ");

        return label;
    }
}