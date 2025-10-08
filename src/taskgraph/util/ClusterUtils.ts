import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Cluster } from "../Cluster.js";
import { RegularTask } from "../tasks/RegularTask.js";
import { Statement } from "@specs-feup/clava/api/Joinpoints.js";

export class ClusterUtils {
    public static getLinesOfCode(cluster: Cluster): number {
        let loc = 0;
        for (const task of cluster.getAllTasks()) {
            if (task instanceof RegularTask) {
                const fun = task.getFunction();
                if (fun != undefined) {
                    loc += fun.code.split("\n").length;
                }
            }
        }
        return loc;
    }

    public static getNumberOfStatements(cluster: Cluster): number {
        let numStmts = 0;
        for (const task of cluster.getAllTasks()) {
            if (task instanceof RegularTask) {
                const fun = task.getFunction();
                if (fun != undefined) {
                    numStmts += Query.searchFrom(fun, Statement).get().length;
                }
            }
        }
        return numStmts;
    }
}