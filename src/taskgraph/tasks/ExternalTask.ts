import { BinaryOp, Call, FunctionType, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import { ConcreteTask } from "./ConcreteTask.js";
import { TaskType } from "./TaskType.js";
import { ExternalTaskDataPolicy } from "./ExternalTaskDataPolicy.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { DataItemOrigin } from "../DataItemOrigin.js";
import { DataItem } from "../dataitems/DataItem.js";

export class ExternalTask extends ConcreteTask {
    private externalTaskDataPolicy: ExternalTaskDataPolicy;
    private assignedDataItem: DataItem | null = null;

    constructor(call: Call, hierParent: ConcreteTask, delimiter = ".") {
        super(TaskType.EXTERNAL, call, hierParent, call.name, delimiter, "TEx");

        this.populateExternalCallData();
        this.externalTaskDataPolicy = ExternalTaskDataPolicy.ALL_READ_WRITE;
        this.setExternalTaskDataPolicy(ExternalTaskDataPolicy.ALL_READ_WRITE);
    }

    public setExternalTaskDataPolicy(policy: ExternalTaskDataPolicy): void {
        this.externalTaskDataPolicy = policy;

        for (const dataItem of this.getData()) {
            if (policy === ExternalTaskDataPolicy.ALL_READ) {
                dataItem.setRead();
            }
            else if (policy === ExternalTaskDataPolicy.ALL_WRITE) {
                dataItem.setWritten();
            }
            else if (policy === ExternalTaskDataPolicy.ALL_READ_WRITE) {
                dataItem.setRead();
                dataItem.setWritten();
            }
        }
    }

    public getExternalTaskDataPolicy(): ExternalTaskDataPolicy {
        return this.externalTaskDataPolicy;
    }

    public isAssigned(): boolean {
        return this.assignedDataItem != null;
    }

    public getAssignedDataItem(): DataItem | null {
        return this.assignedDataItem;
    }

    private populateExternalCallData(): void {
        // TS conversion: original code used varrefs, but we are now using vardecls.
        const refs: Set<Vardecl> = new Set();
        const call = this.getCall();

        if (call == null) {
            console.log("[ExternalTask] call is null");
            return;
        }
        for (const ref of Query.searchFrom(call, Varref)) {
            if (!(ref.type instanceof FunctionType)) {
                refs.add(ref.vardecl);
            }
        }
        const vardeclArray: Vardecl[] = Array.from(refs);

        const assignedVardecl = this.getAssignedVardecl(call);
        if (assignedVardecl != null) {
            vardeclArray.push(assignedVardecl);
        }
        this.createDataObjects(vardeclArray, DataItemOrigin.PARAM);

        if (assignedVardecl != null) {
            this.assignedDataItem = this.getDataItemByName(assignedVardecl?.name || "");
        }
    }

    private getAssignedVardecl(call: Call): Vardecl | null {
        const binaryOp = call.getAncestor("binaryOp") as BinaryOp | null;
        if (binaryOp == null) {
            return null;
        }

        if (binaryOp.operator !== "=") {
            return null;
        }
        if (!(binaryOp.left instanceof Varref)) {
            return null;
        }
        const varref = binaryOp.left as Varref;
        if (!(varref.vardecl instanceof Vardecl)) {
            return null;
        }
        return varref.vardecl as Vardecl;
    }
}