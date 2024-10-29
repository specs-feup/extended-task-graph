import { AStage } from "../../AStage.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import StatementDecomposer from "@specs-feup/clava/api/clava/code/StatementDecomposer.js";
import NormalizeToSubset from "@specs-feup/clava/api/clava/opt/NormalizeToSubset.js";
import { BinaryOp, Body, FunctionJp, If, Joinpoint, Loop, Scope, Statement, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import ArrayFlattener from "clava-code-transforms/ArrayFlattener";
import StructDecomposer from "clava-code-transforms/StructDecomposer";
import SwitchToIf from "clava-code-transforms/SwitchToIf";
import FoldingPropagationCombiner from "clava-code-transforms/FoldingPropagationCombiner";

export class SubsetReducer extends AStage {
    constructor(topFunction: string) {
        super("TransFlow-Subset-SubsetReducer", topFunction);
    }

    public reduce() {
        this.normalizeToSubset();
        this.decomposeStatements();
        this.applyCodeTransforms();
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

    public applyCodeTransforms(): boolean {
        try {
            this.applySwitchToIfConversion();
        } catch (e) {
            this.logTrace(e);
            this.logWarning(`Error applying switch-to-if conversion, reverting AST to previous state`);
            return false;
        }

        try {
            this.applyStructDecomposition();
        } catch (e) {
            this.logTrace(e);
            this.logWarning(`Error applying struct decomposition, reverting AST to previous state`);
            return false;
        }

        try {
            this.applyArrayFlattening();
        } catch (e) {
            this.logTrace(e);
            this.logWarning(`Error applying array flattening, reverting AST to previous state`);
            return false;
        }

        try {
            //this.applyConstantFoldingAndPropagation();
        } catch (e) {
            this.logTrace(e);
            this.logWarning(`Error applying constant folding and propagation, reverting AST to previous state`);
            return false;
        }
        return true;
    }

    private applyArrayFlattening(): void {
        let count = 0;

        this.getValidFunctions().forEach((fun) => {
            const flattener = new ArrayFlattener();
            const flattened = flattener.flattenAllInFunction(fun);

            this.log(`Flattened ${flattened} array${flattened > 1 ? "s" : ""} in ${fun.name}()`);
            count += flattened;
        });
        this.log(`Flattened ${count} array${count > 1 ? "s" : ""} into 1D`);
    }

    private applyConstantFoldingAndPropagation(): void {
        this.getValidFunctions().forEach((fun) => {
            const foldProg = new FoldingPropagationCombiner(true);
            const nPasses = foldProg.doPassesUntilStop(fun);

            this.log(`Applied constant folding and propagation to function ${fun.name} in ${nPasses} pass${nPasses > 1 ? "es" : ""}`);
        });
    }

    private applyStructDecomposition(): void {
        const decomp = new StructDecomposer(true);
        const structNames = decomp.decomposeAll();

        this.log(`Decomposed ${structNames.length} struct${structNames.length > 1 ? "s" : ""}: ${structNames.join(", ")}`);
    }

    private applySwitchToIfConversion(): void {
        const switchToIf = new SwitchToIf();
        let count = 0;

        for (const switchStmt of Query.search(Switch)) {
            const success = switchToIf.convert(switchStmt);
            if (success) {
                count++;
            }
        }
        this.log(`Converted ${count} switch statement${count > 1 ? "s" : ""} into if-else statements`);
    }

    private getValidFunctions(): FunctionJp[] {
        return ClavaUtils.getAllUniqueFunctions(this.getTopFunctionJoinPoint());
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