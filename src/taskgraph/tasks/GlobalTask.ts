import { Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import { Task } from "./Task.js";
import { TaskType } from "./TaskType.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { DataItem } from "../DataItem.js";
import { DataItemOrigin } from "../DataItemOrigin.js";

export class GlobalTask extends Task {
    #dataGlobalDecls: DataItem[] = [];

    constructor() {
        super(TaskType.GLOBALSOURCE);
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
        for (const global of Query.search(Vardecl, { isGlobal: true })) {
            const data = new DataItem(global, DataItemOrigin.GLOBAL_DECL);
            this.#dataGlobalDecls.push(data);
        }
    }

    #setDataInitStatus() {
        for (const data of this.#dataGlobalDecls) {
            data.setRead();
        }
    }
}