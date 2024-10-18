import { Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import { DataItem } from "./DataItem.js";
import { DataItemOrigin } from "../DataItemOrigin.js";

export class VariableDataItem extends DataItem {
    private ref: Vardecl;

    constructor(ref: Vardecl, origin: DataItemOrigin) {
        super(ref.name, ref.type, origin);
        this.ref = ref;
    }

    public getDecl(): Vardecl {
        return this.ref;
    }
}