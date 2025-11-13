import { Outliner } from "@specs-feup/clava-code-transforms/Outliner";
import { Cluster } from "../Cluster.js";
import { RegularTask } from "../tasks/RegularTask.js";
import { TopologicalSort } from "../util/TopologicalSort.js";
import { BinaryOp, Call, DeclStmt, Expression, FileJp, FunctionJp, If, Include, Loop, Param, ReturnStmt, Scope, Statement, Struct, Switch, TypedefDecl, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
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
                return ClavaJoinPoints.unaryOp("&", ClavaJoinPoints.varRef(unglobifiedName, globalDecl.type));
            }
            else {
                this.log(`  Global ${globalDecl.name} passed as-is.`);
                return ClavaJoinPoints.varRef(unglobifiedName, globalDecl.type);
            }
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
        // add struct defs
        for (const struct of Query.searchFrom(sourceFile, Struct)) {
            const structClone = struct.deepCopy() as Struct;
            targetFile.insertBegin(structClone);
        }
        // add typedefs
        for (const declStmt of Query.searchFrom(sourceFile, DeclStmt, (d) => {
            if (d.children.length === 0) {
                return false;
            }
            const child = d.children[0];
            return child instanceof TypedefDecl;
        })) {
            const declClone = declStmt.deepCopy() as DeclStmt;
            targetFile.insertBegin(declClone);
        }
        // add includes
        for (const include of Query.searchFrom(sourceFile, Include)) {
            targetFile.addInclude(include.name, include.isAngled);
        }
    }

    private buildSelector(swCall: Statement, bridgeCall: Statement): void {
        const comment = ClavaJoinPoints.stmtLiteral("// Selector between SW and HW bridge calls based on OFFLOAD getenv variable");
        bridgeCall.insertBefore(comment);

        const getenvCall = ClavaJoinPoints.callFromName("getenv", ClavaJoinPoints.type("char*"), ClavaJoinPoints.exprLiteral("\"OFFLOAD\""));
        const comparison = ClavaJoinPoints.binaryOp("!=", getenvCall, ClavaJoinPoints.exprLiteral("NULL"));

        bridgeCall.detach();
        const trueScope = ClavaJoinPoints.scope(bridgeCall);
        trueScope.setNaked(false)

        swCall.detach();
        const falseScope = ClavaJoinPoints.scope(swCall);
        falseScope.setNaked(false)

        const ifStmt = ClavaJoinPoints.ifStmt(comparison, trueScope, falseScope);
        comment.insertAfter(ifStmt);
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

                if (oldGlobal == null || oldGlobal === undefined) {
                    this.logWarning(`  Could not find declaration statement for global variable ${varName}. Skipping.`);
                    return;
                }

                if (!globalDecls.has(varName)) {
                    const newGlobal = oldGlobal.deepCopy() as DeclStmt;
                    for (const decl of newGlobal.decls) {
                        // remove const keyword from global declarations
                        const split = decl.code.split(" ");
                        const filtered = split.filter((token) => token !== "const");
                        const declCode = filtered.join(" ");
                        // add static to global declarations
                        const newGlobal = ClavaJoinPoints.declLiteral(`static ${declCode}`);
                        decl.replaceWith(newGlobal);
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
        const name = `${cluster.getEntryPointName()}_sw`;
        let startPoint: Statement | null = null;
        let endPoint: Statement | null = null;

        if (this.isFlatCluster(cluster)) {
            this.log("  Cluster is flat. Using first and last task calls as outlining boundaries.");
            const orderedTasks = TopologicalSort.sort(tasks);
            const firstTask = orderedTasks[0] as RegularTask;
            const lastTask = orderedTasks[orderedTasks.length - 1] as RegularTask;

            const firstCall = firstTask.getCall()!.parent as Statement;
            const lastCall = lastTask.getCall()!.parent as Statement;

            if (firstCall === undefined || lastCall === undefined) {
                throw new Error("[ClusterOutliner] Task calls must have a parent statement.");
            }
            startPoint = firstCall;
            endPoint = lastCall;
        }
        else {
            this.log("  Cluster is non-flat, searching for common ancestor statement");
            const [stmtChains, minSize] = this.buildStmtChains(cluster);
            let commonAncestor: Statement | null = null;

            for (let i = 0; i < minSize; i++) {
                const currentStmts = stmtChains.map((chain) => chain[i]);
                const firstStmt = currentStmts[0];
                const allEqual = currentStmts.every((stmt) => stmt.astId === firstStmt.astId);
                if (allEqual) {
                    commonAncestor = firstStmt;
                }
                else {
                    break;
                }
            }
            if (commonAncestor === null) {
                throw new Error("[ClusterOutliner] Could not find a common ancestor statement for outlining");
            }
            if (commonAncestor instanceof Loop) {
                this.log("  Common ancestor is a loop");
            }
            else if (commonAncestor instanceof If) {
                this.log("  Common ancestor is an if statement");
            }
            else if (commonAncestor instanceof Switch) {
                this.log("  Common ancestor is a switch");
            }
            else {
                throw new Error(`[ClusterOutliner] Common ancestor is not a valid outlining statement, was of type ${commonAncestor.joinPointType}`);
            }
            startPoint = commonAncestor;
            endPoint = commonAncestor;
        }

        this.log(`  Outlining cluster region into function ${name}`);
        const outliner = new Outliner();
        const [newFun, newCall] = outliner.outlineWithName(startPoint, endPoint, name);
        if (newFun === null || newCall === null) {
            throw new Error("[ClusterOutliner] Outlining failed to produce a new function or call.");
        }
        this.log(`  Outlined function ${newFun.name} created successfully.`);
        return [newFun, newCall];
    }

    private isFlatCluster(cluster: Cluster): boolean {
        const tasks = cluster.getTasks();
        const scopes = tasks.map((task) => {
            const call = task.getCall();
            if (call === null) {
                throw new Error("[ClusterOutliner] Task does not have an associated call");
            }
            return call.getAncestor("scope") as Scope;
        });
        return scopes.every((scope) => scope.astId === scopes[0].astId);
    }

    private buildStmtChains(cluster: Cluster): [Statement[][], number] {
        const tasks = cluster.getTasks();
        let smallestChainSize = Number.MAX_SAFE_INTEGER;

        const scopeChains: Statement[][] = tasks.map((task) => {
            const call = task.getCall();
            if (call === null) {
                throw new Error("[ClusterOutliner] Task does not have an associated call");
            }
            const chain = [];
            let currJp = call.parent;
            while (!(currJp instanceof FunctionJp)) {
                if (currJp instanceof Statement) {
                    chain.push(currJp);
                }
                currJp = currJp.parent;
            }
            chain.reverse();
            if (chain.length < smallestChainSize) {
                smallestChainSize = chain.length;
            }
            return chain;
        });
        return [scopeChains, smallestChainSize];
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