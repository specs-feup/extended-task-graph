"use strict";

laraImport("flextask/taskgraph/TaskGraph");
laraImport("flextask/taskgraph/tasks/Task");
laraImport("flextask/taskgraph/Communication");

class TaskGraphDotConverter {
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

    convert(taskGraph, isMinimal = false, includePerf = false) {
        let dot = "digraph G {\n";
        dot += "\trankdir=TB;\n";
        dot += "\tnode [shape=box];\n";

        const source = taskGraph.getSourceTask();
        const sink = taskGraph.getSinkTask();
        const globals = taskGraph.getGlobalTask();

        dot += `\t"${source.getId()}" [label=main_begin, fillcolor=lightgray];\n`;
        dot += `\t"${sink.getId()}" [label=main_end, fillcolor=lightgray];\n`;
        dot += `\t"${globals.getId()}" [label="${this.#getLabelOfTask(globals, isMinimal, includePerf)}", fillcolor=lightgray];\n`;

        const topHierTask = taskGraph.getTopHierarchicalTask();
        dot += this.#getDotOfCluster(topHierTask, isMinimal, includePerf);

        dot += "\n";
        dot += this.#getDotOfCommunications(taskGraph);

        dot += "\n";
        dot += this.#getDotOfControl(taskGraph);

        dot += "}";
        return dot;
    }

    convertMinimal(taskGraph) {
        return this.dump(taskGraph, true);
    }

    convertWithPerformance(taskGraph) {
        return this.dump(taskGraph, true, true);
    }

    #getColor(index) {
        const len = TaskGraphDumper.hierarchicalColors.length;
        const color = TaskGraphDumper.hierarchicalColors[index % len];
        return color;
    }

    #getDotOfCluster(task, isMinimal = false, includePerf = false, colorIndex = 0) {
        let dot = "";
        if (task.getHierarchicalChildren().length > 0) {
            dot += `\tsubgraph "cluster_${task.getId()}" {\n`;
            dot += `\tlabel = "${this.#getLabelOfTask(task, isMinimal, includePerf)}";\n`;
            dot += `\tbgcolor = ${this.#getColor(colorIndex)};\n`;

            dot += `\t"${task.getId()}_src" [shape=circle, label=""];\n`;
            dot += `\t"${task.getId()}_target" [shape=diamond, label=""];\n`;
            dot += `\t"${task.getId()}_src" -> "${task.getId()}_target" [style=invis];\n`;

            for (const child of task.getHierarchicalChildren()) {
                const next = this.#getDotOfCluster(child, isMinimal, includePerf, colorIndex + 1);
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
            dot += `\t"${task.getId()}" [label="${this.#getLabelOfTask(task, isMinimal, includePerf)}", style="filled", fillcolor=${this.#getColor(colorIndex)}];\n`;
        }
        return dot;
    }

    #toPercent(value, precision = 1) {
        return `${(value * 100).toFixed(precision)}%`;
    }

    #secToUsec(seconds, precision = 1) {
        if (seconds == -1 || seconds == null) {
            return "N/A";
        }
        return `${(seconds * 1000000).toFixed(precision)}us`
    }

    #getLabelOfTask(task, isMinimal = false, includePerf = false) {
        let label = `${task.getId()}: ${task.getName()}`;

        const reps = task.getRepetitions();
        if (reps > 1) {
            label += ` (x${reps})`;
        }
        if (reps == -1) {
            label += ` (xANY)`;
        }

        if (includePerf) {
            const cpuPerf = task.getAnnotation("cpu");
            const fpgaPerf = task.getAnnotation("fpga");

            if (cpuPerf == null || fpgaPerf == null) {
                return label;
            }

            label += `\n-------------------\n`;
            label += `CPU Time: ${this.#secToUsec(cpuPerf.cpuTime)}\n`;
            label += `FPGA Time: ${this.#secToUsec(fpgaPerf.execBest)}\n`;
            label += `\nFF | LUT | BRAM | DSP\n`;
            label += `${this.#toPercent(fpgaPerf.resources.perFF)} |`;
            label += `${this.#toPercent(fpgaPerf.resources.perLUT)} |`;
            label += `${this.#toPercent(fpgaPerf.resources.perBRAM)} |`;
            label += `${this.#toPercent(fpgaPerf.resources.perDSP)}`;
            return label;
        }

        if (isMinimal) {
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