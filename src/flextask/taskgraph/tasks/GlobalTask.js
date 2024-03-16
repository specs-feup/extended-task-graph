"use strict";

laraImport("lara.util.IdGenerator");
laraImport("flextask/taskgraph/tasks/Task");
laraImport("flextask/taskgraph/tasks/TaskTypes");


class GlobalTask extends Task {
    #dataGlobalDecls = [];

    constructor() {
        super(TaskTypes.GLOBALSOURCE);
        this.setId("TG");
        this.setName("<globals_source>");

        this.#populateGlobalData();
        this.#setDataInitStatus();
    }

    getGlobalDeclData() {
        return this.#dataGlobalDecls;
    }

    getData() {
        const otherData = super.getData();  // always empty... in theory
        return [...otherData, ...this.#dataGlobalDecls];
    }

    #populateGlobalData() {
        for (const global of Query.search("vardecl", { isGlobal: true })) {
            const data = new DataItem(global, DataItemOrigins.GLOBAL_DECL);
            this.#dataGlobalDecls.push(data);
        }
    }

    #setDataInitStatus() {
        for (const data of this.#dataGlobalDecls) {
            data.setRead();
        }
    }
}