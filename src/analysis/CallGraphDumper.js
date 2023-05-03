"use strict";

laraImport("weaver.Query");
laraImport("clava.graphs.StaticCallGraph");

class CallGraphDumper {
    constructor() { }

    dump() {
        const callGraph = StaticCallGraph.build(Query.root());

        return callGraph.toDot();
    }
}