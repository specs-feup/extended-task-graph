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

    decomposeStatements(maxPasses = 1) {
        const decomp = new StatementDecomposer();
        let hasChanged = true;
        let nPasses = 0;

        while (hasChanged && nPasses < maxPasses) {
            hasChanged = false;

            for (const stmt of Query.search("statement", { isInsideHeader: false })) {
                if (stmt.instanceOf(["body", "scope", "if", "loop"])) {
                    continue;
                }

                const hasMatchedTemp = this.#matchesATemplate(stmt);
                const hasMatchedUnique = this.#matchesUniqueCircumstance(stmt);

                if (hasMatchedTemp || hasMatchedUnique) {
                    decomp.decomposeAndReplace(stmt);
                    hasChanged = true;
                }
            }
            if (hasChanged) {
                nPasses++;
            }
            println("------");
        }
        this.log("Successfully decomposed statements in " + nPasses + " passes");
    }

    #matchesATemplate(stmt) {
        const templates = [
            //["exprStmt", ["binaryOp", ["arrayAccess"], ["call"]]]
            ["binaryOp noassign", ["call"], ["_"]],
            ["binaryOp noassign", ["_"], ["call"]],
            ["ternaryOp", ["call"], ["_"], ["_"]],
            ["ternaryOp", ["_"], ["call"], ["_"]],
            ["ternaryOp", ["_"], ["_"], ["call"]],
        ];

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
        return hasMatched;
    }

    #matchesUniqueCircumstance(stmt) {
        const assignsInStmt = Query.searchFrom(stmt, "binaryOp", { kind: "assign" }).chain().length;

        // A[1] = A[0] = foo(X)
        if (assignsInStmt > 1) {
            return true;
        }

        // if (X = foo(Y) == 2) {...}
        if (this.#isInIfCondition(stmt)) {
            if (assignsInStmt > 0) {
                return true;
            }
        }

        return false;
    }

    #isInIfCondition(stmt) {
        let jp = stmt;
        while (jp != null) {
            if (jp.instanceOf("if")) {
                return true;
            }
            if (jp.instanceOf("body")) {
                return false;
            }
            jp = jp.parent;
        }
        return false;
    }
}