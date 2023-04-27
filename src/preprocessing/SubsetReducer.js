"use strict";

laraImport("weaver.Query");
laraImport("clava.opt.NormalizeToSubset");
laraImport("clava.opt.PrepareForInlining");
laraImport("clava.code.Inliner");
laraImport("clava.code.StatementDecomposer");

class SubsetReducer {
    constructor() { }

    reduce() {
        this.normalizeToSubset();
        this.decomposeStatements();
    }

    normalizeToSubset() {
        NormalizeToSubset(Query.root(), { simplifyLoops: { forToWhile: false } });
    }

    decomposeStatements() {
        const decomp = new StatementDecomposer();

        for (var stmt of Query.search("statement", { isInsideHeader: false })) {
            decomp.decomposeAndReplace(stmt);
        }
    }
}