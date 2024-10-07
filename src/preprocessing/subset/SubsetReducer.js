"use strict";

laraImport("weaver.Query");
laraImport("clava.opt.NormalizeToSubset");
laraImport("clava.opt.PrepareForInlining");
laraImport("clava.code.Inliner");
laraImport("clava.code.StatementDecomposer");
laraImport("clava.code.Voidifier");
laraImport("clava.code.ArrayFlattener");
laraImport("clava.code.FoldingPropagationCombiner");
laraImport("clava.code.SwitchToIf");
laraImport("clava.code.StructDecomposer");
laraImport("flextask/util/ClavaUtils")
laraImport("flextask/AStage");

class SubsetReducer extends AStage {
    constructor(topFunction) {
        super("CTFlow-Subset-SubsetReducer", topFunction);
    }

    reduce() {
        this.normalizeToSubset();
        this.decomposeStatements();
        this.applyCodeTransforms();
        this.ensureVoidReturns();
    }

    normalizeToSubset() {
        const funs = this.#getValidFunctions();
        for (const fun of funs) {
            const body = fun.body;
            NormalizeToSubset(body, { simplifyLoops: { forToWhile: false } });
        }
        this.log("Codebase normalized to subset");
    }

    decomposeStatements(maxPasses = 1) {
        const decomp = new StatementDecomposer();
        let hasChanged = true;
        let nPasses = 0;
        const funs = this.#getValidFunctions();

        while (hasChanged && nPasses < maxPasses) {
            hasChanged = false;

            for (const fun of funs) {
                for (const stmt of Query.searchFrom(fun, "statement", { isInsideHeader: false })) {
                    if (stmt.instanceOf(["body", "scope", "if", "loop"])) {
                        continue;
                    }

                    const hasMatchedTemp = this.#matchesATemplate(stmt);
                    const hasMatchedEdgeCase = this.#matchesEdgeCase(stmt);

                    if (hasMatchedTemp || hasMatchedEdgeCase) {
                        decomp.decomposeAndReplace(stmt);
                        hasChanged = true;
                    }
                }
            }
            nPasses++;
        }
        this.log(`Decomposed statements in ${nPasses} pass${nPasses > 1 ? "es" : ""}`);
    }

    applyCodeTransforms() {
        this.#applySwitchToIfConversion();
        //this.#applyStructDecomposition();
        this.#applyConstantFoldingAndPropagation();
        this.#applyArrayFlattening();
    }

    ensureVoidReturns() {
        const funs = this.#getValidFunctions();
        const vf = new Voidifier();

        let count = 0;
        for (const fun of funs) {
            if (fun.name == "main") {
                this.log("Skipping voidification of main(), which is part of the valid call graph for subset reduction");
            }
            else {
                const turnedVoid = vf.voidify(fun, "rtr_val");
                count += turnedVoid ? 1 : 0;
            }
        }
        this.log(`Ensured ${count} function${count > 1 ? "s" : ""} return${count > 1 ? "s" : ""} void`);
    }

    #applyArrayFlattening() {
        const flattener = new ArrayFlattener();

        const funs = this.#getValidFunctions();
        for (const fun of funs) {
            flattener.flattenAllInFunction(fun);
        }
        this.log("Flattened all arrays into 1D");
    }

    #applyConstantFoldingAndPropagation() {
        try {
            const foldProg = new FoldingPropagationCombiner();

            const nPasses = foldProg.doPassesUntilStop();
            this.log(`Applied constant propagation in ${nPasses} pass${nPasses > 1 ? "es" : ""}`);
        }
        catch (e) {
            this.logTrace(e);
            this.logWarning("Constant folding and propagation may not have been thorough");
        }
    }

    #applyStructDecomposition() {
        const decomp = new StructDecomposer(true);

        const structNames = decomp.decomposeAll();
        this.log(`Decomposed ${structNames.length} struct${structNames.length > 1 ? "s" : ""}: ${structNames.join(", ")}`);
    }

    #applySwitchToIfConversion() {
        const switchToIf = new SwitchToIf();
        let count = 0;

        for (const switchStmt of Query.search("switch")) {
            switchToIf.convert(switchStmt);
            count++;
        }
        this.log(`Converted ${count} switch statement${count > 1 ? "s" : ""} into if-else statements`);
    }

    #getValidFunctions() {
        return ClavaUtils.getAllUniqueFunctions(this.getTopFunctionJoinPoint());
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
                const matched = ClavaUtils.matchTemplate(binaryOp, template);
                if (matched) {
                    hasMatched = true;
                    break;
                }
            }
        }
        return hasMatched;
    }

    #matchesEdgeCase(stmt) {
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