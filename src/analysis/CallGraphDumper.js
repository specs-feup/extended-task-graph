"use strict";

laraImport("weaver.Query");
laraImport("clava.graphs.StaticCallGraph");

class CallGraphDumper {
    constructor() { }

    dump(topFunction) {
        const callGraph = StaticCallGraph.build(topFunction);
        const callGraphDot = callGraph.toDot();

        return callGraphDot;
    }
}