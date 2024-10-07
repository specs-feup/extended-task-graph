"use strict";

laraImport("flextask/taskgraph/TaskGraph");
laraImport("flextask/taskgraph/tasks/Task");
laraImport("flextask/taskgraph/Communication");

class DotConverter {
    constructor() { }

    static hierarchicalColors = [
        "bisque",
        "lightpink",
        "aquamarine2",
        "lightgrey",
        "violet",
        "lightskyblue",
        "yellowgreen"
    ];

    convert(taskGraph) {
        let dot = "digraph G {\n";
        dot += "\trankdir=TB;\n";
        dot += "\tnode [shape=box];\n";

        const source = taskGraph.getSourceTask();
        const sink = taskGraph.getSinkTask();
        const globals = taskGraph.getGlobalTask();

        dot += `\t"${source.getId()}" [label="${this.getLabelOfTask(source)}", fillcolor=lightgray];\n`;
        dot += `\t"${sink.getId()}" [label="${this.getLabelOfTask(sink)}", fillcolor=lightgray];\n`;
        dot += `\t"${source.getId()}" -> "${sink.getId()}" [style=invis];\n`;

        dot += `\t"${globals.getId()}" [label="${this.getLabelOfTask(globals)}", fillcolor=lightgray];\n`;

        const topHierTask = taskGraph.getTopHierarchicalTask();
        dot += this.#getDotOfCluster(topHierTask);

        dot += "\n";
        dot += this.#getDotOfEdges(taskGraph.getCommunications());

        dot += "\n";
        dot += this.#getDotOfEdges(taskGraph.getControlEdges(), "red");

        dot += "}";
        return dot;
    }

    getLabelOfTask(task) {
        let label = `${task.getId()}: ${task.getName()}`;

        if (task.getType() == TaskTypes.REGULAR || task.getType() == TaskTypes.EXTERNAL) {
            const reps = task.getRepetitions();
            if (reps > 1) {
                label += ` (x${reps})`;
            }
            if (reps == -1) {
                label += ` (xANY)`;
            }
        }
        return label;
    }

    getLabelOfEdge(edge) {
        return edge.toString();
    }

    #getColor(index) {
        const len = DotConverter.hierarchicalColors.length;
        const color = DotConverter.hierarchicalColors[index % len];
        return color;
    }

    #getDotOfCluster(task, colorIndex = 0) {
        let dot = "";
        if (task.getHierarchicalChildren().length > 0) {
            dot += `\tsubgraph "cluster_${task.getId()}" {\n`;
            dot += `\tlabel = "${this.getLabelOfTask(task)}";\n`;
            dot += `\tbgcolor = ${this.#getColor(colorIndex)};\n`;

            dot += `\t"${task.getId()}_src" [shape=circle, label=""];\n`;
            dot += `\t"${task.getId()}_target" [shape=diamond, label=""];\n`;
            dot += `\t"${task.getId()}_src" -> "${task.getId()}_target" [style=invis];\n`;

            for (const child of task.getHierarchicalChildren()) {
                const next = this.#getDotOfCluster(child, colorIndex + 1);
                dot += next;

                if (next.startsWith("\tsubgraph")) {
                    dot += `\t"${child.getId()}_target" -> "${task.getId()}_target" [style=invis];\n`;
                }
                else {
                    dot += `\t"${child.getId()}" -> "${task.getId()}_target" [style=invis];\n`;
                }
            }
            dot += "\t}\n";
        }
        else {
            dot += `\t"${task.getId()}" [label="${this.getLabelOfTask(task)}", style="filled", fillcolor=${this.#getColor(colorIndex)}];\n`;
        }
        return dot;
    }

    #getDotOfEdges(edgeList, color = "black") {
        let dot = "";

        for (const edge of edgeList) {
            const label = this.getLabelOfEdge(edge);
            const source = edge.getSource();
            const target = edge.getTarget();

            const sourceIsConcrete = source.getType() == TaskTypes.EXTERNAL || source.getType() == TaskTypes.REGULAR;
            const targetIsConcrete = target.getType() == TaskTypes.EXTERNAL || target.getType() == TaskTypes.REGULAR;

            const sourceHasHierChildren = sourceIsConcrete ? source.getHierarchicalChildren().length > 0 : false;
            const targetHasHierChildren = targetIsConcrete ? target.getHierarchicalChildren().length > 0 : false;
            const targetHierarchicalParent = targetIsConcrete ? target.getHierarchicalParent() : null;

            if (targetHierarchicalParent !== source) {
                if (sourceHasHierChildren && targetHasHierChildren) {
                    dot += `\t"${source.getId()}_target" -> "${target.getId()}_src" [label="${label}", color="${color}", fontcolor="${color}"];\n`;
                }
                if (sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t"${source.getId()}_target" -> "${target.getId()}" [label="${label}", color="${color}", fontcolor="${color}"];\n`;
                }
                if (!sourceHasHierChildren && targetHasHierChildren) {
                    dot += `\t"${source.getId()}" -> "${target.getId()}_src" [label="${label}", color="${color}", fontcolor="${color}"];\n`;
                }
                if (!sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t"${source.getId()}" -> "${target.getId()}" [label="${label}", color="${color}", fontcolor="${color}"];\n`;
                }
            }
            else {
                if (sourceHasHierChildren && targetHasHierChildren) {
                    dot += `\t"${source.getId()}_src" -> "${target.getId()}_src" [label="${label}"];\n`;
                }
                if (sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t"${source.getId()}_src" -> "${target.getId()}" [label="${label}"];\n`;
                }
                if (!sourceHasHierChildren && targetHasHierChildren) {
                    dot += `\t"${source.getId()}" -> "${target.getId()}_src" [label="${label}"];\n`;
                }
                if (!sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t"${source.getId()}" -> "${target.getId()}" [label="${label}"];\n`;
                }
            }
        }
        return dot;
    }
}