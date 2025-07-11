import { AStage } from "../../AStage.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import StatementDecomposer from "@specs-feup/clava/api/clava/code/StatementDecomposer.js";
import NormalizeToSubset from "@specs-feup/clava/api/clava/opt/NormalizeToSubset.js";
import { BinaryOp, Body, If, Joinpoint, Loop, Scope, Statement } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export class SubsetReducer extends AStage {
    constructor(topFunction: string) {
        super("TransFlow-Subset-SubsetReducer", topFunction);
    }

    public reduce(): void {
        this.normalizeToSubset();
        this.decomposeStatements();
    }

    public normalizeToSubset() {
        const funs = this.getValidFunctions();
        for (const fun of funs) {
            const body = fun.body;
            NormalizeToSubset(body, { simplifyLoops: { forToWhile: false } });
        }
        this.log("Codebase normalized to subset");
    }

    public decomposeStatements(maxPasses = 1) {
        const decomp = new StatementDecomposer();
        let hasChanged = true;
        let nPasses = 0;
        const funs = this.getValidFunctions();

        while (hasChanged && nPasses < maxPasses) {
            hasChanged = false;

            for (const fun of funs) {
                for (const stmt of Query.searchFrom(fun, Statement, { isInsideHeader: false })) {
                    let skippable = false;
                    skippable ||= stmt instanceof Body;
                    skippable ||= stmt instanceof Scope;
                    skippable ||= stmt instanceof If;
                    skippable ||= stmt instanceof Loop;

                    if (skippable) {
                        continue;
                    }

                    const hasMatchedTemp = this.matchesATemplate(stmt);
                    const hasMatchedEdgeCase = this.matchesEdgeCase(stmt);

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

    private matchesATemplate(stmt: Statement): boolean {
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

            for (const binaryOp of Query.searchFrom(stmt, BinaryOp)) {
                const matched = ClavaUtils.matchTemplate(binaryOp, template);
                if (matched) {
                    hasMatched = true;
                    break;
                }
            }
        }
        return hasMatched;
    }

    private matchesEdgeCase(stmt: Statement): boolean {
        const assignsInStmt = Query.searchFrom(stmt, BinaryOp, { kind: "assign" }).chain().length;

        // A[1] = A[0] = foo(X)
        if (assignsInStmt > 1) {
            return true;
        }

        // if (X = foo(Y) == 2) {...}
        if (this.isInIfCondition(stmt)) {
            if (assignsInStmt > 0) {
                return true;
            }
        }
        return false;
    }

    private isInIfCondition(stmt: Statement): boolean {
        let jp: Joinpoint = stmt as Joinpoint;
        while (jp != null) {
            if (jp instanceof If) {
                return true;
            }
            if (jp instanceof Body) {
                return false;
            }
            jp = jp.parent;
        }
        return false;
    }
}