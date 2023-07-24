"use strict";

laraImport("taskgraph/TaskGraph");
laraImport("taskgraph/Task");
laraImport("taskgraph/Communication");

class TaskGraphDumper {
    constructor() { }

    dump(taskGraph) {
        const tasks = taskGraph.getTasks();

        let dot = "digraph G {\n";
        dot += "    rankdir=TB;\n";
        dot += "    node [shape=box];\n";

        dot += "    TStart [label=\"main_begin\"];\n";
        dot += "    TEnd [label=\"main_begin\"];\n";

        for (const task of tasks) {
            dot += `    ${task.getId()} [label="${task.getFunction().name}"];\n`;
        }
        dot += "}\n";

        return dot;
    }
}