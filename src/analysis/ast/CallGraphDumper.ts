import { FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import { DotSorting } from "../../util/DotSorting.js";
import StaticCallGraph from "@specs-feup/clava/api/clava/graphs/StaticCallGraph.js";

export class CallGraphDumper {
    constructor() { }

    dump(topFunction: FunctionJp, rankdir: DotSorting = DotSorting.LEFT_TO_RIGHT): string {
        const callGraph = StaticCallGraph.build(topFunction);
        const callGraphDot = callGraph.toDot(/*rankdir*/);

        return callGraphDot;
    }
}