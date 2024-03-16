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

        dot += `\t"${source.getId()}" [label="${this.#getLabelOfTask(source, isMinimal, includePerf)}", fillcolor=lightgray];\n`;
        dot += `\t"${sink.getId()}" [label="${this.#getLabelOfTask(sink, isMinimal, includePerf)}", fillcolor=lightgray];\n`;
        dot += `\t"${source.getId()}" -> "${sink.getId()}" [style=invis];\n`;

        dot += `\t"${globals.getId()}" [label="${this.#getLabelOfTask(globals, isMinimal, includePerf)}", fillcolor=lightgray];\n`;

        const topHierTask = taskGraph.getTopHierarchicalTask();
        dot += this.#getDotOfCluster(topHierTask, isMinimal, includePerf);

        dot += "\n";
        dot += this.#getDotOfEdges(taskGraph.getCommunications());

        dot += "\n";
        dot += this.#getDotOfEdges(taskGraph.getControlEdges(), "red");

        dot += "}";
        return dot;
    }

    convertMinimal(taskGraph) {
        return this.convert(taskGraph, true);
    }

    convertWithPerformance(taskGraph) {
        return this.convert(taskGraph, true, true);
    }

    #getColor(index) {
        const len = TaskGraphDotConverter.hierarchicalColors.length;
        const color = TaskGraphDotConverter.hierarchicalColors[index % len];
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

        if (task.getType() == TaskTypes.REGULAR || task.getType() == TaskTypes.EXTERNAL) {
            const reps = task.getRepetitions();
            if (reps > 1) {
                label += ` (x${reps})`;
            }
            if (reps == -1) {
                label += ` (xANY)`;
            }
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

    #getDotOfEdges(edgeList, color = "black") {
        let dot = "";

        for (const edge of edgeList) {
            const source = edge.getSource();
            const target = edge.getTarget();

            const sourceIsConcrete = source.getType() == TaskTypes.EXTERNAL || source.getType() == TaskTypes.REGULAR;
            const targetIsConcrete = target.getType() == TaskTypes.EXTERNAL || target.getType() == TaskTypes.REGULAR;

            const sourceHasHierChildren = sourceIsConcrete ? source.getHierarchicalChildren().length > 0 : false;
            const targetHasHierChildren = targetIsConcrete ? target.getHierarchicalChildren().length > 0 : false;
            const targetHierarchicalParent = targetIsConcrete ? target.getHierarchicalParent() : null;

            if (targetHierarchicalParent !== source) {
                if (sourceHasHierChildren && targetHasHierChildren) {
                    dot += `\t"${source.getId()}_target" -> "${target.getId()}_src" [label="${edge.toString()}", color="${color}", fontcolor="${color}"];\n`;
                }
                if (sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t"${source.getId()}_target" -> "${target.getId()}" [label="${edge.toString()}", color="${color}", fontcolor="${color}"];\n`;
                }
                if (!sourceHasHierChildren && targetHasHierChildren) {
                    dot += `\t"${source.getId()}" -> "${target.getId()}_src" [label="${edge.toString()}", color="${color}", fontcolor="${color}"];\n`;
                }
                if (!sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t"${source.getId()}" -> "${target.getId()}" [label="${edge.toString()}", color="${color}", fontcolor="${color}"];\n`;
                }
            }
            else {
                if (sourceHasHierChildren && targetHasHierChildren) {
                    dot += `\t"${source.getId()}_src" -> "${target.getId()}_src" [label="${edge.toString()}"];\n`;
                }
                if (sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t"${source.getId()}_src" -> "${target.getId()}" [label="${edge.toString()}"];\n`;
                }
                if (!sourceHasHierChildren && targetHasHierChildren) {
                    dot += `\t"${source.getId()}" -> "${target.getId()}_src" [label="${edge.toString()}"];\n`;
                }
                if (!sourceHasHierChildren && !targetHasHierChildren) {
                    dot += `\t"${source.getId()}" -> "${target.getId()}" [label="${edge.toString()}"];\n`;
                }
            }
        }
        return dot;
    }
}