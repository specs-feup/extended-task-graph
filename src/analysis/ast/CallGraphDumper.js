"use strict";

laraImport("weaver.Query");
laraImport("clava.graphs.StaticCallGraph");

class CallGraphDumper {
    constructor() { }

    dump(topFunction, rankdir) {
        const callGraph = StaticCallGraph.build(topFunction);
        const callGraphDot = callGraph.toDot(rankdir);

        return callGraphDot;
    }
}