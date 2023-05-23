"use strict";

laraImport("weaver.Query");
laraImport("clava.opt.NormalizeToSubset");
laraImport("clava.opt.PrepareForInlining");
laraImport("clava.code.Inliner");
laraImport("clava.code.StatementDecomposer");
laraImport("UPTStage");

class SubsetReducer extends UPTStage {
    constructor() {
        super("Preprocessor-SubsetReducer");
    }

    reduce() {
        this.normalizeToSubset();
        this.decomposeStatements();
    }

    normalizeToSubset() {
        NormalizeToSubset(Query.root(), { simplifyLoops: { forToWhile: false } });
        this.log("Successfully normalized to subset");
    }

    decomposeStatements() {
        const decomp = new StatementDecomposer();

        for (var stmt of Query.search("statement", { isInsideHeader: false })) {
            decomp.decomposeAndReplace(stmt);
        }
        this.log("Successfully decomposed statements");
    }
}