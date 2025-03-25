import { FunctionJp, Statement } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export class LinesOfCodeCounter {
    public static countFunction(fun: FunctionJp): number {
        let lines = 1;
        lines += Query.searchFrom(fun, Statement).chain().length;
        return lines;
    }
}