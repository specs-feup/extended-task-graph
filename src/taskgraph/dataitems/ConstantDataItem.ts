import { FloatLiteral, IntLiteral, Literal } from "@specs-feup/clava/api/Joinpoints.js";
import { DataItemOrigin } from "../DataItemOrigin.js";
import { DataItem } from "./DataItem.js";

export class ConstantDataItem extends DataItem {
    private literal: Literal;

    constructor(literal: IntLiteral | FloatLiteral) {
        super(`imm(${literal.value})`, literal.type, DataItemOrigin.CONSTANT);
        this.literal = literal;
    }

    public getLiteral(): Literal {
        return this.literal;
    }
}