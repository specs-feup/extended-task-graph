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
        const templates = [
            //["exprStmt", ["binaryOp", ["arrayAccess"], ["call"]]]
            ["binaryOp noassign", ["call"], ["_"]],
            ["binaryOp noassign", ["_"], ["call"]],
            ["ternaryOp", ["call"], ["_"], ["_"]],
            ["ternaryOp", ["_"], ["call"], ["_"]],
            ["ternaryOp", ["_"], ["_"], ["call"]],
        ];

        for (const stmt of Query.search("statement", { isInsideHeader: false })) {
            if (stmt.instanceOf(["body", "scope", "if", "loop"])) continue;
            let hasMatched = false;

            for (const template of templates) {

                for (const binaryOp of Query.searchFrom(stmt)) {
                    const matched = UPTUtils.matchTemplate(binaryOp, template);
                    if (matched) {
                        hasMatched = true;
                        break;
                    }
                }
            }
            if (hasMatched) {
                //println(stmt.code);
                //println(stmt.joinPointType);
                decomp.decomposeAndReplace(stmt);
            }
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