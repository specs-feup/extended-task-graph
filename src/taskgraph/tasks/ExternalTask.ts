import { Call, FunctionType, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import { ConcreteTask } from "./ConcreteTask.js";
import { Task } from "./Task.js";
import { TaskType } from "./TaskType.js";
import { ExternalTaskDataPolicy } from "./ExternalTaskDataPolicy.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { DataItemOrigin } from "../DataItemOrigin.js";

class ExternalTask extends ConcreteTask {
    #externalTaskDataPolicy: ExternalTaskDataPolicy;

    constructor(call: Call, hierParent: Task, delimiter = ".") {
        super(TaskType.EXTERNAL, call, hierParent, call.name, delimiter, "TEx");

        this.#populateExternalCallData();
        this.#externalTaskDataPolicy = ExternalTaskDataPolicy.ALL_READ_WRITE;
        this.setExternalTaskDataPolicy(ExternalTaskDataPolicy.ALL_READ_WRITE);
    }

    #populateExternalCallData() {
        const refs: Set<Varref> = new Set();
        for (const ref of Query.searchFrom(this.getCall(), Varref)) {
            if (!(ref.type instanceof FunctionType)) {
                refs.add(ref);
            }
        }
        const varrefArray: Varref[] = Array.from(refs);
        this.createDataObjects(, DataItemOrigin.PARAM);
    }

    setExternalTaskDataPolicy(policy) {
        this.#externalTaskDataPolicy = policy;

        for (const dataItem of this.getData()) {
            if (policy === ExternalTaskDataPolicies.ALL_READ) {
                dataItem.setRead();
            }
            else if (policy === ExternalTaskDataPolicies.ALL_WRITE) {
                dataItem.setWritten();
            }
            else if (policy === ExternalTaskDataPolicies.ALL_READ_WRITE) {
                dataItem.setRead();
                dataItem.setWritten();
            }
        }
    }

    getExternalTaskDataPolicy() {
        return this.#externalTaskDataPolicy;
    }
}