import { AStage } from "../../AStage.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import { FunctionJp, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { ArrayFlattener } from "clava-code-transforms/ArrayFlattener";
import { StructDecomposer } from "clava-code-transforms/StructDecomposer";
import { SwitchToIf } from "clava-code-transforms/SwitchToIf";
import { FoldingPropagationCombiner } from "clava-code-transforms/FoldingPropagationCombiner";
import Clava from "@specs-feup/clava/api/clava/Clava.js";

export class CodeTransformer extends AStage {
    private silentTransforms: boolean;

    constructor(topFunction: string, silentTransforms = false) {
        super("TransFlow-Subset-CodeTransformer", topFunction);
        this.silentTransforms = silentTransforms;
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
            this.applyArrayFlattening();
        } catch (e) {
            this.logTrace(e);
            this.logWarning(`Error applying array flattening, reverting AST to previous state`);
            return false;
        }

        try {
            this.applyConstantFoldingAndPropagation(true);
        } catch (e) {
            this.logTrace(e);
            this.logWarning(`Error applying constant folding and propagation, reverting AST to previous state`);
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
            this.applyConstantFoldingAndPropagation(false);
        } catch (e) {
            this.logTrace(e);
            this.logWarning(`Error applying second constant folding/propagation transformation, reverting AST to previous state`);
            return false;
        }

        return true;
    }

    public setSilentTransforms(silent: boolean): void {
        this.silentTransforms = silent;
    }

    // --------------------------------------------------------------------------------
    private applyArrayFlattening(): void {
        const flattener = new ArrayFlattener(this.silentTransforms);
        const count = flattener.flattenAll();
        Clava.rebuild();

        this.log(`Flattened ${count} array${count > 1 ? "s" : ""} into 1D`);
    }

    private applyConstantFoldingAndPropagation(firstRun: boolean = false): void {
        this.getValidFunctions().forEach((fun) => {
            const foldProg = new FoldingPropagationCombiner(this.silentTransforms);
            const nPasses = foldProg.doPassesUntilStop(fun);

            this.log(`Applied constant folding/propagation to function ${fun.name} in ${nPasses} pass${nPasses > 1 ? "es" : ""}`);
        });
        Clava.rebuild();

        this.log(`Applied ${firstRun ? "" : "additional"} constant folding/propagation to all functions and global variables`);
    }

    private applyStructDecomposition(): void {
        const decomp = new StructDecomposer(this.silentTransforms);
        const structNames = decomp.decomposeAll();
        Clava.rebuild();

        this.log(`Decomposed ${structNames.length} struct${structNames.length > 1 ? "s" : ""}: ${structNames.join(", ")}`);
    }

    private applySwitchToIfConversion(): void {
        const switchToIf = new SwitchToIf(this.silentTransforms);
        let count = 0;

        for (const switchStmt of Query.search(Switch)) {
            const success = switchToIf.convert(switchStmt);
            if (success) {
                count++;
            }
        }
        Clava.rebuild();

        this.log(`Converted ${count} switch statement${count > 1 ? "s" : ""} into if-else statements`);
    }

    private getValidFunctions(): FunctionJp[] {
        return ClavaUtils.getAllUniqueFunctions(this.getTopFunctionJoinPoint());
    }
}