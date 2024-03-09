"use strict";

laraImport("lara.util.IdGenerator");
laraImport("flextask/taskgraph/tasks/ConcreteTask");
laraImport("flextask/taskgraph/tasks/TaskTypes");


class ExternalTask extends ConcreteTask {

    constructor(call, hierParent, delimiter = ".") {
        super(TaskTypes.EXTERNAL, call, hierParent, call.name, delimiter, "TEx");

        this.#populateExternalCallData();
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
}