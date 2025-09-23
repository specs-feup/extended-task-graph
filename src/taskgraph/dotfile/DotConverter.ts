import { Cluster } from "../Cluster.js";
import { Communication } from "../Communication.js";
import { ControlEdge } from "../ControlEdge.js";
import { TaskGraph } from "../TaskGraph.js";
import { ConcreteTask } from "../tasks/ConcreteTask.js";
import { Task } from "../tasks/Task.js";
import { TaskType } from "../tasks/TaskType.js";

export class DotConverter {
    constructor() { }

    public static hierarchicalColors = [
        "bisque",
        "lightpink",
        "lightskyblue1",
        "lightgrey",
        "violet",
        "aquamarine2",
        "yellowgreen"
    ];

    public convert(taskGraph: TaskGraph): string {
        let dot = "digraph G {\n";
        dot += "\trankdir=TB;\n";
        dot += "\tnode [shape=box];\n";

        const source = taskGraph.getSourceTask();
        const sink = taskGraph.getSinkTask();
        const globals = taskGraph.getGlobalTask();

        dot += `\t"${source.getId()}" [label="${this.getLabelOfTask(source)}", fillcolor=lightgray];\n`;
        dot += `\t"${sink.getId()}" [label="${this.getLabelOfTask(sink)}", fillcolor=lightgray];\n`;
        dot += `\t"${source.getId()}" -> "${sink.getId()}" [style=invis];\n`;

        const topHierTask = taskGraph.getTopHierarchicalTask();
        if (topHierTask == null) {
            console.log("[DotConverter] No top hierarchical task found, cannot convert to DOT.");
            dot += "}";
            return dot;
        }
        dot += this.getDotOfCluster(topHierTask);

        dot += "\n";
        dot += this.getDotOfEdges(taskGraph.getCommunications()).join("");

        dot += "\n";
        dot += this.getDotOfEdges(taskGraph.getControlEdges(), "red").join("");

        dot += "}";

        if (dot.includes(`"TG"`)) {
            dot += `\t"${globals.getId()}" [label="${this.getLabelOfTask(globals)}", fillcolor=lightgray];\n`;
        }
        return dot;
    }

    public convertCluster(cluster: Cluster, taskGraph: TaskGraph): string {
        let dot = "digraph G {\n";
        dot += "\trankdir=TB;\n";
        dot += "\tnode [shape=box];\n";

        const tasks = cluster.getTasks();
        if (tasks.length === 0) {
            console.log("[DotConverter] Empty cluster, cannot convert to DOT.");
            dot += "}";
            return dot;
        }
        for (const task of tasks) {
            dot += this.getDotOfCluster(task);
        }
        dot += "\n";

        const allEdges = [
            ...this.getDotOfEdges(taskGraph.getCommunications()),
            ...this.getDotOfEdges(taskGraph.getControlEdges(), "red")
        ];
        const clusterEdges = allEdges.filter((edge) => {
            const [sourceId, rest] = edge.split(" -> ");
            const targetId = rest.split(" [")[0];


            const trimmedSourceId = sourceId.replace(/"/g, "").trim();
            const trimmedTargetId = targetId.replace(/"/g, "").trim();

            const sourceInCluster = dot.includes(`${trimmedSourceId}`);
            const targetInCluster = dot.includes(`${trimmedTargetId}`);
            return sourceInCluster && targetInCluster;
        });
        dot += clusterEdges.join("");
        dot += "\n";

        dot += "}";
        return dot;
    }

    protected getLabelOfTask(task: Task): string {
        let label = `${task.getId()}: ${task.getName()}`;

        if (task.getType() == TaskType.REGULAR || task.getType() == TaskType.EXTERNAL) {
            const concreteTask = task as ConcreteTask;
            const reps = concreteTask.getRepetitions();
            if (reps > 1) {
                label += ` (x${reps})`;
            }
            if (reps == -1) {
                label += ` (xANY)`;
            }
        }
        return label;
    }

    protected getLabelOfEdge(edge: Communication | ControlEdge): string {
        return edge.toString();
    }

    protected getColor(index: number): string {
        const len = DotConverter.hierarchicalColors.length;
        const color = DotConverter.hierarchicalColors[index % len];
        return color;
    }

    protected getColorForTask(task: Task, index: number): string {
        return this.getColor(index);
    }

    protected getDotOfCluster(task: ConcreteTask, colorIndex = 0): string {
        const color = this.getColorForTask(task, colorIndex);
        let dot = "";
        if (task.getHierarchicalChildren().length > 0) {
            dot += `\tsubgraph "cluster_${task.getId()}" {\n`;
            dot += `\tlabel = "${this.getLabelOfTask(task)}";\n`;
            dot += `\tbgcolor = ${color};\n`;

            dot += `\t"${task.getId()}_src" [shape=circle, label=""];\n`;
            dot += `\t"${task.getId()}_target" [shape=diamond, label=""];\n`;
            dot += `\t"${task.getId()}_src" -> "${task.getId()}_target" [style=invis];\n`;

            for (const child of task.getHierarchicalChildren()) {
                const next = this.getDotOfCluster(child, colorIndex + 1);
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
            const borderStyle = task.getType() == TaskType.EXTERNAL ? "dashed" : "solid";
            dot += `\t"${task.getId()}" [label="${this.getLabelOfTask(task)}", style="filled,${borderStyle}", fillcolor=${color}];\n`;
        }
        return dot;
    }

    private getDotOfEdges(edgeList: Communication[] | ControlEdge[], color = "black"): string[] {
        const dotEdges: string[] = [];

        for (const edge of edgeList) {
            const label = this.getLabelOfEdge(edge);
            const source = edge.getSource() as ConcreteTask;
            const target = edge.getTarget() as ConcreteTask;

            const sourceIsConcrete = source.getType() == TaskType.EXTERNAL || source.getType() == TaskType.REGULAR;
            const targetIsConcrete = target.getType() == TaskType.EXTERNAL || target.getType() == TaskType.REGULAR;

            const sourceHasHierChildren = sourceIsConcrete ? source.getHierarchicalChildren().length > 0 : false;
            const targetHasHierChildren = targetIsConcrete ? target.getHierarchicalChildren().length > 0 : false;
            const targetHierarchicalParent = targetIsConcrete ? target.getHierarchicalParent() : null;

            if (targetHierarchicalParent !== source) {
                if (sourceHasHierChildren && targetHasHierChildren) {
                    dotEdges.push(`\t"${source.getId()}_target" -> "${target.getId()}_src" [label="${label}", color="${color}", fontcolor="${color}"];\n`);
                }
                if (sourceHasHierChildren && !targetHasHierChildren) {
                    dotEdges.push(`\t"${source.getId()}_target" -> "${target.getId()}" [label="${label}", color="${color}", fontcolor="${color}"];\n`);
                }
                if (!sourceHasHierChildren && targetHasHierChildren) {
                    dotEdges.push(`\t"${source.getId()}" -> "${target.getId()}_src" [label="${label}", color="${color}", fontcolor="${color}"];\n`);
                }
                if (!sourceHasHierChildren && !targetHasHierChildren) {
                    dotEdges.push(`\t"${source.getId()}" -> "${target.getId()}" [label="${label}", color="${color}", fontcolor="${color}"];\n`);
                }
            }
            else {
                if (sourceHasHierChildren && targetHasHierChildren) {
                    dotEdges.push(`\t"${source.getId()}_src" -> "${target.getId()}_src" [label="${label}"];\n`);
                }
                if (sourceHasHierChildren && !targetHasHierChildren) {
                    dotEdges.push(`\t"${source.getId()}_src" -> "${target.getId()}" [label="${label}"];\n`);
                }
                if (!sourceHasHierChildren && targetHasHierChildren) {
                    dotEdges.push(`\t"${source.getId()}" -> "${target.getId()}_src" [label="${label}"];\n`);
                }
                if (!sourceHasHierChildren && !targetHasHierChildren) {
                    dotEdges.push(`\t"${source.getId()}" -> "${target.getId()}" [label="${label}"];\n`);
                }
            }
        }
        return dotEdges;
    }
}