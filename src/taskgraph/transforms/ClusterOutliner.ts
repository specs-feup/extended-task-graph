import { Outliner } from "@specs-feup/clava-code-transforms/Outliner";
import { Cluster } from "../Cluster.js";
import { RegularTask } from "../tasks/RegularTask.js";
import { TopologicalSort } from "../util/TopologicalSort.js";
import { BinaryOp, Call, DeclStmt, Expression, FileJp, FunctionJp, Include, Param, ReturnStmt, Scope, Statement, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import { AStage } from "../../AStage.js";

export class ClusterOutliner extends AStage {
    constructor(topFunction: string, outputDir: string, appName: string) {
        super("ClusterOutliner", topFunction, outputDir, appName);
    }

    public outlineCluster(cluster: Cluster): [FunctionJp, FunctionJp, FunctionJp] | null {
        const tasks = cluster.getTasks();
        if (tasks.length === 0) {
            throw new Error("[ClusterOutliner] Cannot outline an empty cluster.");
        }
        const ext = Clava.isCxx() ? "cpp" : "c";
        const clusterName = cluster.getName();
        this.log(`Outlining cluster ${clusterName} with ${tasks.length} tasks.`);

        // get the sw cluster
        this.log(`Building SW function for cluster ${clusterName}.`);
        const [swFun, swCall] = cluster.hasSingleTask() ? this.renameSwFunction(cluster) : this.buildSwFunction(cluster);
        const swCallStmt = swCall.parent as Statement;
        const swFile = swFun.getAncestor("file") as FileJp;

        // build hw cluster
        this.log(`Building HW cluster function for cluster ${clusterName}.`);
        const clusterFilename = `${clusterName}.${ext}`;
        const clusterFile = ClavaJoinPoints.file(clusterFilename);
        Clava.addFile(clusterFile);
        const [clusterFun, newParams] = this.buildClusterFunction(clusterFile, swFun, clusterName);

        // build bridge
        this.log(`Building bridge function for cluster ${clusterName}.`);
        const bridgeFilename = `${clusterName}_bridge.${ext}`;
        const bridgeFile = ClavaJoinPoints.file(bridgeFilename);
        Clava.addFile(bridgeFile);
        const [bridgeFun, newBridgeParams] = this.buildBridge(bridgeFile, swFun, clusterFun, newParams);

        // build call to bridge
        this.log(`Building call to bridge function for cluster ${clusterName}.`);
        const bridgeCallBaseArgs = swCall.args.map((arg) => arg.deepCopy()) as Expression[];
        const bridgeCallGlobalArgs = newBridgeParams.map((param) => {
            const unglobifiedName = param.name.replace("global_", "");
            const globalDecl = Query.search(Vardecl, { name: unglobifiedName }).first();
            if (globalDecl === null || globalDecl === undefined) {
                throw new Error(`[ClusterOutliner] Could not find global variable declaration for ${unglobifiedName}`);
            }

            const derefNeeded = !globalDecl?.type.isPointer && param.type.isPointer;
            if (derefNeeded) {
                this.log(`  Global ${globalDecl.name} requires dereferencing.`);
            }
            else {
                this.log(`  Global ${globalDecl.name} passed as-is.`);
            }
            const type = derefNeeded ? ClavaJoinPoints.pointer(globalDecl.type) : globalDecl.type;

            return ClavaJoinPoints.varRef(unglobifiedName, type);
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
            this.log(`Successfully outlined cluster ${clusterName}.`);
            return [swFun, bridgeFun, clusterFun];
        } catch (error) {
            this.logError("[ClusterOutliner] Error during outlining cluster:" + error);
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
        const needsDeref: string[] = [];
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
                const oldGlobal = varref.vardecl.getAncestor("statement") as DeclStmt;
                const isOnlyRead = this.isOnlyRead(varref, clonedFuns);

                if (!globalDecls.has(varName)) {
                    const newGlobal = oldGlobal.deepCopy() as DeclStmt;
                    for (const decl of newGlobal.decls) {
                        decl.replaceWith(ClavaJoinPoints.declLiteral(`static ${decl.code}`));
                    }
                    clusterFile.insertBegin(newGlobal);
                    globalDecls.add(varName);

                    const baseType = varref.vardecl.type;
                    let newType;
                    if (!isOnlyRead && !baseType.isPointer) {
                        newType = ClavaJoinPoints.pointer(varref.vardecl.type);
                        needsDeref.push(varName);
                        this.log(`  Scalar global ${varName} of type ${baseType.code} will be passed as a pointer.`);
                    }
                    else {
                        newType = varref.vardecl.type;
                        this.log(`  Global ${varName} of type ${baseType.code} will be passed by value.`);
                    }
                    const newParam = ClavaJoinPoints.param(`global_${varName}`, newType);
                    newParams.push(newParam);
                }
                varref.setName(varName);
            });
        }
        mainFun.setParams([...mainFun.params, ...newParams]);

        const body = mainFun.body as Scope;
        newParams.reverse()
        this.updateBodyWithGlobals(newParams, needsDeref, body, mainFun);
        newParams.reverse();
        return newParams;
    }

    private updateBodyWithGlobals(newParams: Param[], needsDeref: string[], body: Scope, mainFun: FunctionJp) {
        for (const param of newParams) {
            const varName = param.name.replace("global_", "");
            const doDeref = needsDeref.includes(varName);
            const lhs = ClavaJoinPoints.varRef(varName, param.type);

            const rhsRef = ClavaJoinPoints.varRef(param.name, param.type);
            const rhs = doDeref ? ClavaJoinPoints.unaryOp("*", rhsRef) : rhsRef;

            const assign = ClavaJoinPoints.binaryOp("=", lhs, rhs);
            const assignStmt = ClavaJoinPoints.exprStmt(assign);
            body.insertBegin(assignStmt);

            if (doDeref) {
                const endLhsRef = ClavaJoinPoints.varRef(param.name, param.type);
                const endLhs = ClavaJoinPoints.unaryOp("*", endLhsRef);
                const endRhs = ClavaJoinPoints.varRef(varName, ClavaJoinPoints.pointer(param.type));
                const endAssign = ClavaJoinPoints.binaryOp("=", endLhs, endRhs);
                const endAssignStmt = ClavaJoinPoints.exprStmt(endAssign);

                let atLeastOnce = false;
                for (const retStmt of Query.searchFrom(body, ReturnStmt)) {
                    retStmt.insertBefore(endAssignStmt.deepCopy());
                    atLeastOnce = true;
                }
                if (!atLeastOnce) {
                    body.insertEnd(endAssignStmt);
                }
            }
        }
        this.log(`  Added ${newParams.length} global parameters to cluster function ${mainFun.name}.`);
    }

    private isOnlyRead(varref: Varref, funs: FunctionJp[]): boolean {
        for (const fun of funs) {
            for (const assign of Query.searchFrom(fun, BinaryOp, (b) => b.operator === "=").get()) {
                const lhs = assign.left;
                for (const ref of Query.searchFromInclusive(lhs, Varref).get()) {
                    if (ref.name === varref.name) {
                        return false;
                    }
                }
            }
        }
        return true;
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
                    this.logWarning("[ClusterOutliner] Multiple calls found for the top-level task's function. Using the first one.");
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