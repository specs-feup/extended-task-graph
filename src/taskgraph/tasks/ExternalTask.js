"use strict";

laraImport("lara.util.IdGenerator");
laraImport("flextask/taskgraph/tasks/ConcreteTask");
laraImport("flextask/taskgraph/tasks/TaskTypes");
laraImport("flextask/taskgraph/tasks/ExternalTaskDataPolicies");

class ExternalTask extends ConcreteTask {
    #externalTaskDataPolicy;

    constructor(call, hierParent, delimiter = ".") {
        super(TaskTypes.EXTERNAL, call, hierParent, call.name, delimiter, "TEx");

        this.#populateExternalCallData();
        this.setExternalTaskDataPolicy(ExternalTaskDataPolicies.ALL_READ_WRITE);
    }

    #populateExternalCallData() {
        const refs = new Set();
        for (const ref of Query.searchFrom(this.getCall(), "varref")) {
            if (!ref.type.instanceOf("functionType")) {
                refs.add(ref);
            }
        }
        this.createDataObjects([...refs], DataItemOrigins.PARAM);
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