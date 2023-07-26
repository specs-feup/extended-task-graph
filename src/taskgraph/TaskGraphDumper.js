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
        dot += this.#getDotOfTask(topHierTask);

        dot += "}";
        return dot;
    }

    #getDotOfTask(task) {
        let dot = "";
        if (task.getHierarchicalChildren().length > 0) {
            dot += "\tsubgraph cluster_" + task.getId() + " {\n";
            dot += "\tlabel = \"" + task.getFunction().name + "\";\n";

            for (const child of task.getHierarchicalChildren()) {
                dot += this.#getDotOfTask(child);
            }
            dot += "\t}\n";
        }
        else {
            dot += `\t${task.getId()} [label="${task.getFunction().name}"];\n`;
        }
        return dot;
    }
}