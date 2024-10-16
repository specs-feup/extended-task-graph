import { Call, FunctionType, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import { ConcreteTask } from "./ConcreteTask.js";
import { Task } from "./Task.js";
import { TaskType } from "./TaskType.js";
import { ExternalTaskDataPolicy } from "./ExternalTaskDataPolicy.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { DataItemOrigin } from "../DataItemOrigin.js";

export class ExternalTask extends ConcreteTask {
    private externalTaskDataPolicy: ExternalTaskDataPolicy;

    constructor(call: Call, hierParent: Task, delimiter = ".") {
        super(TaskType.EXTERNAL, call, hierParent, call.name, delimiter, "TEx");

        this.populateExternalCallData();
        this.externalTaskDataPolicy = ExternalTaskDataPolicy.ALL_READ_WRITE;
        this.setExternalTaskDataPolicy(ExternalTaskDataPolicy.ALL_READ_WRITE);
    }

    public setExternalTaskDataPolicy(policy: ExternalTaskDataPolicy) {
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

    private populateExternalCallData() {
        // TS conversion: original code used varrefs, but we are now using vardecls.
        const refs: Set<Vardecl> = new Set();
        const call = this.getCall();
        if (call == null) {
            console.log("ExternalTask: call is null");
            return;
        }
        for (const ref of Query.searchFrom(call, Varref)) {
            if (!(ref.type instanceof FunctionType)) {
                refs.add(ref.vardecl);
            }
        }
        const vardeclArray: Vardecl[] = Array.from(refs);
        this.createDataObjects(vardeclArray, DataItemOrigin.PARAM);
    }

    public getExternalTaskDataPolicy() {
        return this.externalTaskDataPolicy;
    }
}