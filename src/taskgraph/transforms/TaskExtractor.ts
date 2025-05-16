import { RegularTask } from "../tasks/RegularTask.js";
import { FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import { ClusterExtractor } from "./ClusterExtractor.js";
import { Cluster } from "../Cluster.js";

export class TaskExtractor extends ClusterExtractor {

    public extractTask(task: RegularTask, clusterName: string = "cluster0", fileName?: string): FunctionJp | null {
        const cluster = new Cluster(clusterName);
        cluster.addTask(task);

        return this.extractCluster(cluster, clusterName, fileName, true);
    }
}