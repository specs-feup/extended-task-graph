import { Outliner } from "@specs-feup/clava-code-transforms/Outliner";
import { Cluster } from "../Cluster.js";
import { RegularTask } from "../tasks/RegularTask.js";
import { TopologicalSort } from "../util/TopologicalSort.js";
import { Call, Expression, FileJp, FunctionJp, Include, Statement } from "@specs-feup/clava/api/Joinpoints.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";

export class ClusterOutliner {
    public outlineCluster(cluster: Cluster): [FunctionJp, FunctionJp, FunctionJp] | null {
        const tasks = cluster.getTasks();
        if (tasks.length === 0) {
            throw new Error("Cannot outline an empty cluster.");
        }
        const ext = Clava.isCxx() ? "cpp" : "c";
        const clusterName = cluster.getName();

        // get the sw cluster
        const [swFun, swCall] = cluster.hasSingleTask() ? this.renameSwFunction(cluster) : this.buildSwFunction(cluster);
        const swCallStmt = swCall.parent as Statement;
        const swFile = swFun.getAncestor("file") as FileJp;

        // build hw cluster
        const clusterFilename = `${clusterName}.${ext}`;
        const clusterFile = ClavaJoinPoints.file(clusterFilename);
        Clava.addFile(clusterFile);
        const clusterFun = this.buildClusterFunction(clusterFile, swFun, clusterName);

        // build bridge
        const bridgeFilename = `${clusterName}_bridge.${ext}`;
        const bridgeFile = ClavaJoinPoints.file(bridgeFilename);
        Clava.addFile(bridgeFile);
        const bridgeFun = this.buildBridge(bridgeFile, swFun, clusterFun);

        // build call to bridge
        const bridgeCallArgs = swCall.args.map((arg) => arg.deepCopy()) as Expression[];
        const bridgeCall = ClavaJoinPoints.call(bridgeFun, ...bridgeCallArgs);
        const brigeCallStmt = ClavaJoinPoints.exprStmt(bridgeCall);
        swCallStmt.insertAfter(brigeCallStmt);

        // add selector between sw and bridge calls
        this.buildSelector(swCallStmt, brigeCallStmt);

        // add bridge declaration to original file
        const bridgeDecl = ClavaJoinPoints.stmtLiteral(`${bridgeFun.getDeclaration(true)};`);
        (swCall.getAncestor("function") as FunctionJp).insertBefore(bridgeDecl);

        // replicate includes to cluster and bridge files
        this.replicateIncludes(swFile, bridgeFile);
        this.replicateIncludes(swFile, clusterFile);

        try {
            Clava.rebuild();
            return [swFun, bridgeFun, clusterFun];
        } catch (error) {
            console.error("Error during outlining cluster:", error);
            return null;
        }
    }

    private replicateIncludes(sourceFile: FileJp, targetFile: FileJp): void {
        for (const include of Query.searchFrom(sourceFile, Include)) {
            targetFile.addInclude(include.name, include.isAngled);
        }
    }

    private buildSelector(swCall: Statement, bridgeCall: Statement): void {
        const ifDef = ClavaJoinPoints.stmtLiteral("#ifndef OFFLOAD");
        swCall.insertBefore(ifDef);

        const elseDef = ClavaJoinPoints.stmtLiteral("#else");
        swCall.insertAfter(elseDef);

        const endIfDef = ClavaJoinPoints.stmtLiteral("#endif // OFFLOAD");
        bridgeCall.insertAfter(endIfDef);
    }

    private buildClusterFunction(clusterFile: FileJp, topFun: FunctionJp, clusterName: string): FunctionJp {
        const baseName = topFun.name.replace("_sw", "");
        const clusterFunName = `${baseName}_hw`;
        const clusterFun = topFun.clone(clusterFunName);
        clusterFun.detach();
        clusterFile.insertBegin(clusterFun);

        const clonedFuns: FunctionJp[] = [clusterFun];

        const originalFuns = ClavaUtils.getEligibleFunctionsFrom(topFun);
        const originalFunNames = originalFuns.map((fun) => fun.name);
        originalFuns.forEach((fun) => {
            const newName = `${clusterName}_${fun.name}`;
            const funClone = fun.clone(newName);
            funClone.detach();
            clusterFun.insertAfter(funClone);
            clonedFuns.push(funClone);

            // add declaration to cluster function
            const funDecl = ClavaJoinPoints.stmtLiteral(`${funClone.getDeclaration(true)};`);
            clusterFun.insertBefore(funDecl);
        });

        for (const clone of clonedFuns) {
            for (const call of Query.searchFrom(clone, Call)) {
                if (originalFunNames.includes(call.name)) {
                    const newName = `${clusterName}_${call.name}`;
                    call.setName(newName);
                }
            }
        }
        return clusterFun;
    }

    private buildBridge(bridgeFile: FileJp, topFun: FunctionJp, clusterFun: FunctionJp): FunctionJp {
        const bridgeFunName = topFun.name.replace("sw", "hw_bridge");
        const bridgeFun = topFun.clone(bridgeFunName);
        bridgeFun.detach();
        bridgeFile.insertBegin(bridgeFun);

        bridgeFun.body.stmts.forEach((stmt) => stmt.detach());

        const args = bridgeFun.params.map((param) => ClavaJoinPoints.varRef(param));
        const clusterCall = ClavaJoinPoints.call(clusterFun, ...args);
        const clusterCallStmt = ClavaJoinPoints.exprStmt(clusterCall);
        bridgeFun.body.insertBegin(clusterCallStmt);

        // add declaration of hw function
        const clusterDecl = ClavaJoinPoints.stmtLiteral(`${clusterFun.getDeclaration(true)};`);
        bridgeFun.insertBefore(clusterDecl);

        return bridgeFun;
    }

    private buildSwFunction(cluster: Cluster): [FunctionJp, Call] {
        const tasks = cluster.getTasks();
        const orderedTasks = TopologicalSort.sort(tasks);
        const firstTask = orderedTasks[0] as RegularTask;
        const lastTask = orderedTasks[orderedTasks.length - 1] as RegularTask;

        const name = `${cluster.getEntryPointName()}_sw`;
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

    private renameSwFunction(cluster: Cluster): [FunctionJp, Call] {
        const task = cluster.getTasks()[0] as RegularTask;
        const fun = task.getFunction();
        const call = task.getCall();

        if (fun === null || call === null) {
            throw new Error("Task must have a function and a call to rename.");
        }

        const name = `${cluster.getEntryPointName()}_sw`;
        fun.setName(name);
        call.setName(name);
        return [fun, call];
    }
}