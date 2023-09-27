"use strict";

laraImport("taskgraph/TaskGraph");
laraImport("taskgraph/Task");
laraImport("taskgraph/Communication");

class TaskGraphDumper {
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

    dump(taskGraph, isMinimal = false) {
        let dot = "digraph G {\n";
        dot += "\trankdir=TB;\n";
        dot += "\tnode [shape=box];\n";

        const source = taskGraph.getSource();
        const sink = taskGraph.getSink();
        const globals = taskGraph.getGlobalTask();

        dot += `\t"${source.getId()}" [label=main_begin, fillcolor=lightgray];\n`;
        dot += `\t"${sink.getId()}" [label=main_end, fillcolor=lightgray];\n`;
        dot += `\t"${globals.getId()}" [label="${this.#getLabelOfTask(globals, isMinimal)}", fillcolor=lightgray];\n`;

        const topHierTask = taskGraph.getTopHierarchicalTask();
        dot += this.#getDotOfCluster(topHierTask, isMinimal);

        dot += "\n";
        dot += this.#getDotOfCommunications(taskGraph);

        dot += "\n";
        dot += this.#getDotOfControl(taskGraph);

        dot += "}";
        return dot;
    }

    dumpMinimal(taskGraph) {
        return this.dump(taskGraph, true);
    }

    #getColor(index) {
        const len = TaskGraphDumper.hierarchicalColors.length;
        const color = TaskGraphDumper.hierarchicalColors[index % len];
        return color;
    }

    #getDotOfCluster(task, isMinimal = false, colorIndex = 0) {
        let dot = "";
        if (task.getHierarchicalChildren().length > 0) {
            dot += `\tsubgraph "cluster_${task.getId()}" {\n`;
            dot += `\tlabel = "${this.#getLabelOfTask(task, isMinimal)}";\n`;
            dot += `\tbgcolor = ${this.#getColor(colorIndex)};\n`;

            dot += `\t"${task.getId()}_src" [shape=circle, label=""];\n`;
            dot += `\t"${task.getId()}_target" [shape=diamond, label=""];\n`;
            dot += `\t"${task.getId()}_src" -> "${task.getId()}_target" [style=invis];\n`;

            for (const child of task.getHierarchicalChildren()) {
                const next = this.#getDotOfCluster(child, isMinimal, colorIndex + 1);
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
            dot += `\t"${task.getId()}" [label="${this.#getLabelOfTask(task, isMinimal)}", style="filled", fillcolor=${this.#getColor(colorIndex)}];\n`;
        }
        return dot;
    }

    #getLabelOfTask(task, isMminimal = false) {
        let label = `${task.getId()}: ${task.getName()}`;

        const reps = task.getRepetitions();
        if (reps > 1) {
            label += ` (x${reps})`;
        }
        if (reps == -1) {
            label += ` (x*)`;
        }

        if (isMminimal) {
            return label;
        }

        if (task.getParamData().length > 0) {
            label += "\n-------------------\n";
            label += "Param data:\n";
            const refData = [];
            for (const data of task.getParamData()) {
                refData.push(data.toString());
            }
            label += refData.join("\n");
        }

        if (task.getGlobalData().length > 0) {
            label += "\n-------------------\n";
            label += "Global data:\n";
            const globalData = [];
            for (const data of task.getGlobalData()) {
                globalData.push(data.toString());
            }
            label += globalData.join("\n");
        }

        if (task.getNewData().length > 0) {
            label += "\n-------------------\n";
            label += "New data:\n";
            const newData = [];
            for (const data of task.getNewData()) {
                newData.push(data.toString());
            }
            label += newData.join("\n");
        }

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
                    dot += `\t"${source.getId()}_target" -> "${target.getId()}_src" [label="${comm.toString()}"];\n`;
                }
                if (sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t"${source.getId()}_target" -> "${target.getId()}" [label="${comm.toString()}"];\n`;
                }
                if (!sourceHasHierChildren && targetHasHierChildren) {
                    dot += `\t"${source.getId()}" -> "${target.getId()}_src" [label="${comm.toString()}"];\n`;
                }
                if (!sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t"${source.getId()}" -> "${target.getId()}" [label="${comm.toString()}"];\n`;
                }
            }
            else {
                if (sourceHasHierChildren && targetHasHierChildren) {
                    dot += `\t"${source.getId()}_src" -> "${target.getId()}_src" [label="${comm.toString()}"];\n`;
                }
                if (sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t"${source.getId()}_src" -> "${target.getId()}" [label="${comm.toString()}"];\n`;
                }
                if (!sourceHasHierChildren && targetHasHierChildren) {
                    dot += `\t"${source.getId()}" -> "${target.getId()}_src" [label="${comm.toString()}"];\n`;
                }
                if (!sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t"${source.getId()}" -> "${target.getId()}" [label="${comm.toString()}"];\n`;
                }
            }
        }
        return dot;
    }

    #getDotOfControl(taskGraph) {
        let dot = "";
        for (const controlEdge of taskGraph.getControlEdges()) {
            const source = controlEdge.getSource();
            const target = controlEdge.getTarget();
            const sourceHasHierChildren = source.getHierarchicalChildren().length > 0;
            const targetHasHierChildren = target.getHierarchicalChildren().length > 0;

            if (sourceHasHierChildren && targetHasHierChildren) {
                dot += `\t"${source.getId()}_target" -> "${target.getId()}_src [label="${controlEdge.toString()}", color="red", fontcolor=red];\n`;
            }
            if (sourceHasHierChildren && !targetHasHierChildren) {
                dot += `\t"${source.getId()}_target" -> "${target.getId()}" [label="${controlEdge.toString()}", color="red", fontcolor=red];\n`;
            }
            if (!sourceHasHierChildren && targetHasHierChildren) {
                dot += `\t"${source.getId()}" -> "${target.getId()}_src" [label="${controlEdge.toString()}", color="red", fontcolor=red];\n`;
            }
            if (!sourceHasHierChildren && !targetHasHierChildren) {
                dot += `\t"${source.getId()}" -> "${target.getId()}" [label="${controlEdge.toString()}", color="red", fontcolor=red];\n`;
            }
        }
        return dot;
    }
}