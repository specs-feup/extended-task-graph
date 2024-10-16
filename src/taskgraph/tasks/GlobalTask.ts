import { Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import { Task } from "./Task.js";
import { TaskType } from "./TaskType.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { DataItem } from "../DataItem.js";
import { DataItemOrigin } from "../DataItemOrigin.js";

export class GlobalTask extends Task {
    private dataGlobalDecls: DataItem[] = [];

    constructor() {
        super(TaskType.GLOBALSOURCE);
        this.setId("TG");
        this.setName("<globals_source>");

        this.populateGlobalData();
        this.setDataInitStatus();
    }

    public getGlobalDeclData(): DataItem[] {
        return this.dataGlobalDecls;
    }

    public getData(): DataItem[] {
        const otherData = super.getData();  // always empty... in theory
        return [...otherData, ...this.dataGlobalDecls];
    }

    private populateGlobalData(): void {
        for (const global of Query.search(Vardecl, { isGlobal: true })) {
            const data = new DataItem(global, DataItemOrigin.GLOBAL_DECL);
            this.dataGlobalDecls.push(data);
        }
    }

    private setDataInitStatus(): void {
        for (const data of this.dataGlobalDecls) {
            data.setRead();
        }
    }
}