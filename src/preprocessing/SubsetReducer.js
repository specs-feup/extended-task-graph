"use strict";

laraImport("weaver.Query");
laraImport("clava.opt.NormalizeToSubset");
laraImport("clava.opt.PrepareForInlining");
laraImport("clava.code.Inliner");
laraImport("clava.code.StatementDecomposer");
laraImport("clava.code.Voidifier");
laraImport("UPTStage");

class SubsetReducer extends UPTStage {
    constructor() {
        super("Preprocessor-SubsetReducer");
    }

    reduce() {
        this.normalizeToSubset();
        this.decomposeStatements();
        this.ensureVoidReturns();
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

    ensureVoidReturns() {
        const vf = new Voidifier();

        let count = 0;
        for (var fun of Query.search("function", { "isImplementation": true })) {
            if (fun.name != "main") {
                const turnedVoid = vf.voidify(fun, "rtr_val");
                count += turnedVoid ? 1 : 0;
            }
        }
        this.log("Successfully ensured " + count + " function(s) return void");
    }
}