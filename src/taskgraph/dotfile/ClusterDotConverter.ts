import { Cluster } from "../Cluster.js";
import { RegularTask } from "../tasks/RegularTask.js";
import { Task } from "../tasks/Task.js";
import { TaskType } from "../tasks/TaskType.js";
import { DotConverter } from "./DotConverter.js";

export class ClusterDotConverter {
    public static hierarchicalColors = [
        "white",
        "bisque",
        "lightskyblue1",
        "lightgrey",
        "violet",
        "aquamarine2",
        "yellowgreen"
    ];

    public convert(cluster: Cluster): string {
        let dot = "digraph G {\n";
        dot += "    rankdir=TB;\n";
        dot += "    node [shape=box];\n";

        const res = this.convertHierarchy(cluster, cluster.getName(), cluster.getTasks(), 0);
        dot += res[0];

        if (res[1]) {
            dot += "    globals [label=\"globals\"];\n";
        }

        dot += "}";
        return dot;
    }

    private convertHierarchy(cluster: Cluster, name: string, tasks: Task[], level: number): [string, boolean] {
        let dot = "";
        const tabs = "    ".repeat(level + 1);
        dot += `${tabs}subgraph "cluster_${name}" {\n`;
        dot += `${tabs}label = "${name}";\n`;
        dot += `${tabs}bgcolor = ${DotConverter.hierarchicalColors[level]};\n`;
        if (level == 0) {
            dot += `${tabs}style = "dashed";\n`;
        }
        dot += `${tabs}"${name}_source" [shape=circle, label=""]\n`;
        dot += `${tabs}"${name}_sink" [shape=circle, label=""]\n`;
        let globalsNeeded = false;

        for (const task of tasks) {
            if (task.getType() == TaskType.REGULAR && (task as RegularTask).getHierarchicalChildren().length > 0) {
                const res = this.convertHierarchy(cluster, task.getName(), (task as RegularTask).getHierarchicalChildren(), level + 1);
                dot += res[0];
                globalsNeeded = globalsNeeded || res[1];
                dot += `${tabs}"${task.getId()}_sink" -> "${name}_sink" [style="invis"];\n`;
            }
            else {
                dot += `${tabs}"${task.getId()}" [label="${task.getName()}", style="filled", fillcolor=${DotConverter.hierarchicalColors[level + 1]}];\n`;
                dot += `${tabs}"${task.getId()}" -> "${name}_sink" [style="invis"]\n`;
            }
            const res = this.convertIncoming(name, cluster, task, level);
            dot += res[0];
            globalsNeeded = globalsNeeded || res[1];

            dot += this.convertOutgoing(name, cluster, task, level);
        }

        dot += `${tabs}}\n`;
        return [dot, globalsNeeded];
    }

    private convertIncoming(parent: string, cluster: Cluster, task: Task, level: number): [string, boolean] {
        const uniqueTaskNames = cluster.getTaskUniqueName();
        const tabs = "    ".repeat(level + 1);
        let dot = "";
        let globalsNeeded = false;

        for (const comm of task.getIncomingComm()) {
            if (uniqueTaskNames.includes(comm.getSource().getUniqueName())) {
                const source = comm.getSource();

                if (source.getType() == TaskType.SOURCE) {
                    dot += `${tabs}"${parent}_source" -> "${task.getId()}" [label="${comm.toString()}", color="black", fontcolor="black"];\n`;
                }
                if (source.getType() == TaskType.GLOBALSOURCE) {
                    dot += `${tabs}"globals" -> "${task.getId()}" [label="${comm.toString()}", color="black", fontcolor="black"]";\n`;
                    globalsNeeded = true;
                }
                if (source.getType() == TaskType.EXTERNAL) {
                    dot += `${tabs}"${source.getId()}" -> "${task.getId()}" [label="${comm.toString()}", color="black", fontcolor="black"];\n`;
                }
                if (source.getType() == TaskType.REGULAR) {
                    const regularTask = source as RegularTask;
                    if (regularTask.getHierarchicalChildren().length == 0) {
                        dot += `${tabs}"${source.getId()}" -> "${task.getId()}" [label="${comm.toString()}", color="black", fontcolor="black"];\n`;
                    }
                    else {
                        dot += `${tabs}"${source.getId()}_sink" -> "${task.getId()}" [label="${comm.toString()}", color="black", fontcolor="black"];\n`;
                    }
                }
            }
            else {
                dot += `${tabs}"${parent}_source" -> "${task.getId()}" [label="${comm.toString()}"];\n`;
            }
        }
        return [dot, globalsNeeded];
    }

    private convertOutgoing(parent: string, cluster: Cluster, task: Task, level: number): string {
        const uniqueTaskNames = cluster.getTaskUniqueName();
        const tabs = "    ".repeat(level + 1);
        let dot = "";

        for (const comm of task.getOutgoingComm()) {
            if (uniqueTaskNames.includes(comm.getSource().getUniqueName())) {
                const target = comm.getTarget();

                if (target.getType() == TaskType.SINK) {
                    dot += `"${tabs}"${task.getId()}"" -> "${parent}_sink" [label="${comm.toString()}"], color="black", fontcolor="black";\n`;
                }
                if (target.getType() == TaskType.GLOBALSOURCE) {
                    dot += `${tabs}"${task.getId()}" -> "globals" [label="${comm.toString()}", color="black", fontcolor="black"];\n`;
                }
                if (target.getType() == TaskType.EXTERNAL) {
                    dot += `${tabs}"${task.getId()}" -> "${target.getId()}" [label="${comm.toString()}", color="black", fontcolor="black"];\n`;
                }
                if (target.getType() == TaskType.REGULAR) {
                    const regularTask = target as RegularTask;
                    if (regularTask.getHierarchicalChildren().length == 0) {
                        dot += `${tabs}"${task.getId()}" -> "${target.getId()}" [label="${comm.toString()}", color="black", fontcolor="black"];\n`;
                    }
                    else {
                        dot += `${tabs}"${task.getId()}" -> "${target.getId()}_target" [label="${comm.toString()}", color="black", fontcolor="black"];\n`;
                    }
                }
            }
            else {
                dot += `${tabs}"${task.getId()}" -> "${parent}_sink" [label="${comm.toString()}"];\n`;
            }
        }
        return dot;
    }
}