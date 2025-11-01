import { Outliner } from "@specs-feup/clava-code-transforms/Outliner";
import { Cluster } from "../Cluster.js";
import { RegularTask } from "../tasks/RegularTask.js";
import { TopologicalSort } from "../util/TopologicalSort.js";
import { Call, Expression, FileJp, FunctionJp, Statement } from "@specs-feup/clava/api/Joinpoints.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";

export class ClusterOutliner {
    public outlineCluster(cluster: Cluster): void {
        const tasks = cluster.getTasks();
        if (tasks.length === 0) {
            throw new Error("Cannot outline an empty cluster.");
        }
        const [topFun, topCall] = tasks.length > 1 ? this.createTopFunction(cluster) : this.renameTopFunction(cluster);

        const ext = Clava.isCxx() ? "cpp" : "c";
        const clusterName = cluster.getName();
        const clusterFilename = `${clusterName}.${ext}`;
        const bridgeName = `${clusterName}_bridge.${ext}`;

        const clusterFile = ClavaJoinPoints.file(clusterFilename);
        const bridgeFile = ClavaJoinPoints.file(bridgeName);

        Clava.addFile(clusterFile);
        Clava.addFile(bridgeFile);

        const clusterFun = this.buildClusterFunction(clusterFile, topFun);

        const bridgeFun = this.buildBridge(bridgeFile, topFun, clusterFun);

        const bridgeCallArgs = topCall.args.map((arg) => arg.deepCopy()) as Expression[];
        const bridgeCall = ClavaJoinPoints.call(bridgeFun, ...bridgeCallArgs);
        const brigeCallStmt = ClavaJoinPoints.exprStmt(bridgeCall);

        topCall.parent.insertAfter(brigeCallStmt);
    }

    private buildClusterFunction(clusterFile: FileJp, topFun: FunctionJp): FunctionJp {
        const clusterFunName = topFun.name.replace("_sw", "_hw");
        const clusterFun = topFun.clone(clusterFunName);
        clusterFile.insertBegin(clusterFun);
        // insert all the other functions
        return clusterFun;
    }

    private buildBridge(bridgeFile: FileJp, topFun: FunctionJp, clusterFun: FunctionJp): FunctionJp {
        const bridgeFunName = topFun.name.replace("sw", "hw_bridge");
        const bridgeFun = topFun.clone(bridgeFunName);
        bridgeFile.insertBegin(bridgeFun);

        bridgeFun.body.stmts.forEach((stmt) => stmt.detach());

        const args = bridgeFun.params.map((param) => ClavaJoinPoints.varRef(param));
        const clusterCall = ClavaJoinPoints.call(clusterFun, ...args);
        const clusterCallStmt = ClavaJoinPoints.exprStmt(clusterCall);
        bridgeFun.body.insertBegin(clusterCallStmt);

        return bridgeFun;
    }

    private createTopFunction(cluster: Cluster): [FunctionJp, Call] {
        const tasks = cluster.getTasks();
        const orderedTasks = TopologicalSort.sort(tasks);
        const firstTask = orderedTasks[0] as RegularTask;
        const lastTask = orderedTasks[orderedTasks.length - 1] as RegularTask;

        const name = `${cluster.getName()}_toplevel_sw`;
        const firstCall = firstTask.getCall()!.parent as Statement;
        const lastCall = lastTask.getCall()!.parent as Statement;

        if (firstCall === undefined || lastCall === undefined) {
            throw new Error("Task calls must have a parent statement.");
        }

        const outliner = new Outliner();
        const [newFun, newCall] = outliner.outlineWithName(firstCall, lastCall, name);
        if (newFun === null || newCall === null) {
            throw new Error("Outlining failed to produce a new function or call.");
        }
        return [newFun, newCall];
    }

    private renameTopFunction(cluster: Cluster): [FunctionJp, Call] {
        const task = cluster.getTasks()[0] as RegularTask;
        const fun = task.getFunction();
        const call = task.getCall();

        if (fun === null || call === null) {
            throw new Error("Task must have a function and a call to rename.");
        }

        const name = `${cluster.getName()}_${fun.name}_sw`;
        fun.setName(name);
        call.setName(name);
        return [fun, call];
    }
}