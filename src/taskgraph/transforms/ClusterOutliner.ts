import { Outliner } from "@specs-feup/clava-code-transforms/Outliner";
import { Cluster } from "../Cluster.js";
import { RegularTask } from "../tasks/RegularTask.js";
import { TopologicalSort } from "../util/TopologicalSort.js";
import { Call, Expression, FileJp, FunctionJp, Include, Param, Statement, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";

export class ClusterOutliner {
    public outlineCluster(cluster: Cluster): [FunctionJp, FunctionJp, FunctionJp] | null {
        const tasks = cluster.getTasks();
        if (tasks.length === 0) {
            throw new Error("[ClusterOutliner] Cannot outline an empty cluster.");
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
        const [clusterFun, newParams] = this.buildClusterFunction(clusterFile, swFun, clusterName);

        // build bridge
        const bridgeFilename = `${clusterName}_bridge.${ext}`;
        const bridgeFile = ClavaJoinPoints.file(bridgeFilename);
        Clava.addFile(bridgeFile);
        const [bridgeFun, newBridgeParams] = this.buildBridge(bridgeFile, swFun, clusterFun, newParams);

        // build call to bridge
        const bridgeCallBaseArgs = swCall.args.map((arg) => arg.deepCopy()) as Expression[];
        const bridgeCallGlobalArgs = newBridgeParams.map((param) => {
            const unglobifiedName = param.name.replace("global_", "");
            return ClavaJoinPoints.varRef(unglobifiedName, param.type);
        });
        const bridgeCallArgs = [...bridgeCallBaseArgs, ...bridgeCallGlobalArgs];
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
            console.error("[ClusterOutliner] Error during outlining cluster:", error);
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

    private buildClusterFunction(clusterFile: FileJp, topFun: FunctionJp, clusterName: string): [FunctionJp, Param[]] {
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

        // rename all calls to original functions inside the cloned functions
        for (const clone of clonedFuns) {
            for (const call of Query.searchFrom(clone, Call)) {
                if (originalFunNames.includes(call.name)) {
                    const newName = `${clusterName}_${call.name}`;
                    call.setName(newName);
                }
            }
        }

        // create pseudo-global variables
        const newParams = this.buildGlobalVariables(clonedFuns, clusterFile);

        return [clusterFun, newParams];
    }

    private buildGlobalVariables(clonedFuns: FunctionJp[], clusterFile: FileJp): Param[] {
        const globalDecls: Set<string> = new Set();
        const newParams: Param[] = [];
        const mainFun = clonedFuns[0];

        for (const clone of clonedFuns) {
            const varrefs = Query.searchFrom(clone, Varref, (v) => {
                if (v.vardecl != null) {
                    return v.vardecl.isGlobal;
                }
                return false;
            }).get();
            varrefs.forEach((varref) => {
                const varName = varref.vardecl.name;

                if (!globalDecls.has(varName)) {
                    const oldGlobal = varref.vardecl.getAncestor("statement") as Statement;
                    const newGlobal = oldGlobal.deepCopy() as Statement;
                    clusterFile.insertBegin(newGlobal);
                    globalDecls.add(varName);

                    const newParam = ClavaJoinPoints.param(`global_${varName}`, varref.vardecl.type);
                    newParams.push(newParam);
                }
                varref.setName(varName);
            });
        }
        mainFun.setParams([...mainFun.params, ...newParams]);

        const body = mainFun.body;
        newParams.reverse()
        for (const param of newParams) {
            const varName = param.name.replace("global_", "");
            const lhs = ClavaJoinPoints.varRef(varName, param.type);
            const rhs = ClavaJoinPoints.varRef(param.name, param.type);
            const assign = ClavaJoinPoints.binaryOp("=", lhs, rhs);
            const assignStmt = ClavaJoinPoints.exprStmt(assign);
            body.insertBegin(assignStmt);
        }
        newParams.reverse();
        return newParams;
    }

    private buildBridge(bridgeFile: FileJp, topFun: FunctionJp, clusterFun: FunctionJp, newParams: Param[]): [FunctionJp, Param[]] {
        const bridgeFunName = topFun.name.replace("sw", "hw_bridge");
        const bridgeFun = topFun.clone(bridgeFunName);
        bridgeFun.detach();
        bridgeFile.insertBegin(bridgeFun);
        bridgeFun.body.stmts.forEach((stmt) => stmt.detach());

        // add extra params to bridge function
        const newBridgeParams = newParams.map((param) => {
            return ClavaJoinPoints.param(param.name, param.type);
        });
        bridgeFun.setParams([...bridgeFun.params, ...newBridgeParams]);

        const args = bridgeFun.params.map((param) => ClavaJoinPoints.varRef(param));
        const clusterCall = ClavaJoinPoints.call(clusterFun, ...args);
        const clusterCallStmt = ClavaJoinPoints.exprStmt(clusterCall);
        bridgeFun.body.insertBegin(clusterCallStmt);

        // add declaration of hw function
        const clusterDecl = ClavaJoinPoints.stmtLiteral(`${clusterFun.getDeclaration(true)};`);
        bridgeFun.insertBefore(clusterDecl);

        return [bridgeFun, newBridgeParams];
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
            throw new Error("[ClusterOutliner] Task calls must have a parent statement.");
        }

        const outliner = new Outliner();
        const [newFun, newCall] = outliner.outlineWithName(firstCall, lastCall, name);
        if (newFun === null || newCall === null) {
            throw new Error("[ClusterOutliner] Outlining failed to produce a new function or call.");
        }
        return [newFun, newCall];
    }

    private renameSwFunction(cluster: Cluster): [FunctionJp, Call] {
        const task = cluster.getTasks()[0] as RegularTask;
        const fun = task.getFunction();
        let call = task.getCall();

        if (fun === null) {
            throw new Error("[ClusterOutliner] Task does not have an associated function");
        }
        if (call === null) {
            if (task.isTopLevelTask()) {
                const calls = Query.search(Call, { name: fun.name }).get();
                if (calls.length == 0) {
                    throw new Error("[ClusterOutliner] Could not find the top-level call for the task's function");
                }
                if (calls.length > 1) {
                    console.warn("[ClusterOutliner] Multiple calls found for the top-level task's function. Using the first one.");
                }
                call = calls[0];
            }
            else {
                throw new Error("[ClusterOutliner] Task does not have an associated call");
            }
        }

        const name = `${cluster.getEntryPointName()}_sw`;
        fun.setName(name);
        call.setName(name);
        return [fun, call];
    }
}