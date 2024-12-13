import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { ConstantDataItem } from "../dataitems/ConstantDataItem.js";
import { VariableDataItem } from "../dataitems/VariableDataItem.js";
import { Cluster } from "../Cluster.js";
import { Call, FileJp, FunctionJp, Param, Statement, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import { AExtractor } from "./AExtractor.js";
import { RegularTask } from "../tasks/RegularTask.js";

export class ClusterExtractor extends AExtractor {
    public extractCluster(cluster: Cluster, clusterName: string = "cluster0", fileName?: string): FunctionJp | null {
        if (fileName == undefined) {
            fileName = `${clusterName}.${ClavaUtils.getCurrentFileExt()}`;
        }
        const firstCall = cluster.getCalls()[0];
        const parenFun = firstCall.getAncestor("function") as FunctionJp;
        const originalFile = firstCall.getAncestor("file") as FileJp;
        const subDir = originalFile.sourceFoldername;

        const fileJp = this.createFile(fileName, subDir);

        const entrypointHw = this.createEntryPoint(cluster, clusterName);
        this.populateEntrypoint(cluster, entrypointHw, true);
        fileJp.insertBegin(entrypointHw);

        const entrypointSw = this.createEntryPoint(cluster, clusterName);
        this.populateEntrypoint(cluster, entrypointSw, false);
        parenFun.insertBefore(entrypointSw);

        const funs: FunctionJp[] = [];
        for (const task of cluster.getTasks()) {
            this.getAllFunctionsInTask(task as RegularTask).forEach(fun => funs.push(fun));
        }
        this.moveToNewFile(funs, fileJp, clusterName);

        const swCall = this.createSwCall(entrypointSw);
        const swCallStmt = ClavaJoinPoints.exprStmt(swCall);
        firstCall.insertBefore(swCallStmt);

        for (const call of cluster.getCalls()) {
            call.parent.detach();
        }
        this.addClusterSwitch(swCall, clusterName);

        const wrapper = this.createWrappedFunction(swCall, entrypointHw, clusterName);

        this.createExternGlobalRefs(fileJp);

        return wrapper;
    }

    private createEntryPoint(cluster: Cluster, name: string): FunctionJp {
        const params: Param[] = [];

        for (const paramName in cluster.getInterfaceDataItems()) {
            const dataItems = cluster.getInterfaceDataItems()[paramName];
            const aDataItem = dataItems[0];

            if (aDataItem instanceof VariableDataItem) {
                const decl = aDataItem.getDecl();
                const type = decl.type;
                const newParam = ClavaJoinPoints.param(paramName, type);
                params.push(newParam);
            }
            if (aDataItem instanceof ConstantDataItem) {
                const type = ClavaJoinPoints.type(aDataItem.getDatatype());
                const newParam = ClavaJoinPoints.param(paramName, type);
                params.push(newParam);
            }
        }
        const voidType = ClavaJoinPoints.type("void");
        const entrypoint = ClavaJoinPoints.functionDecl(name, voidType, ...params);
        return entrypoint;
    }

    private populateEntrypoint(cluster: Cluster, entrypoint: FunctionJp, addPrefix: boolean): void {
        const stmts: Statement[] = [];

        for (const call of cluster.getCalls()) {
            const callCopy = call.copy() as Call;
            if (addPrefix) {
                callCopy.setName(`${entrypoint.name}_${call.name}`);
            }
            else {
                callCopy.setName(call.name);
            }

            const expr = ClavaJoinPoints.exprStmt(callCopy);
            stmts.push(expr);
        }
        const body = ClavaJoinPoints.scope(...stmts);
        entrypoint.setBody(body);
    }

    private createSwCall(entrypoint: FunctionJp): Call {
        const varrefs: Varref[] = [];

        for (const param of entrypoint.params) {
            const varref = ClavaJoinPoints.varRef(param.name, param.type);
            varrefs.push(varref);
        }
        const swCall = ClavaJoinPoints.call(entrypoint, ...varrefs);;
        return swCall;
    }
}