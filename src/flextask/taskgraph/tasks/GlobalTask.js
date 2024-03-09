"use strict";

laraImport("lara.util.IdGenerator");
laraImport("flextask/taskgraph/tasks/Task");
laraImport("flextask/taskgraph/tasks/TaskTypes");


class GlobalTask extends Task {
    #dataGlobals = [];

    constructor() {
        super(TaskTypes.GLOBAL);
        this.setId("global_source");
        this.setName("<global_vars_source>");

        this.#populateGlobalData();
    }

    #populateGlobalData() {
        for (const global of Query.search("vardecl", { isGlobal: true })) {
            const data = new DataItem(global, DataItemOrigins.GLOBAL);
            this.#dataGlobals.push(data);
            this.setReadWritesVar(global, data);
        }
    }
}