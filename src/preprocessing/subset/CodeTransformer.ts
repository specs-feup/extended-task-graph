import { AStage } from "../../AStage.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import { FunctionJp, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { ArrayFlattener } from "clava-code-transforms/ArrayFlattener";
import { StructDecomposer } from "clava-code-transforms/StructDecomposer";
import { SwitchToIf } from "clava-code-transforms/SwitchToIf";
import { FoldingPropagationCombiner } from "clava-code-transforms/FoldingPropagationCombiner";
import Clava from "@specs-feup/clava/api/clava/Clava.js";

export abstract class ATransform extends AStage {
    protected outputFriendlyName;

    constructor(topFunction: string, protected silentTransforms: boolean, outputFriendlyName: string = "Transform") {
        super("TransFlow-Subset-CodeTransformer", topFunction);
        this.outputFriendlyName = outputFriendlyName;
    }

    public apply(): boolean {
        try {
            const count = this.applyTransform();
            const valid = Clava.rebuild();

            if (!valid) {
                this.logWarning(`Error rebuilding AST after ${this.outputFriendlyName}, reverting AST to previous state`);
                return false;
            }
            this.printSuccess(count);
            return true;
        }
        catch (e) {
            this.logTrace(e);
            this.logWarning(`Error applying ${this.outputFriendlyName}, reverting AST to previous state`);
            return false;
        }
    }

    protected getValidFunctions(): FunctionJp[] {
        return ClavaUtils.getAllUniqueFunctions(this.getTopFunctionJoinPoint());
    }

    protected abstract applyTransform(): number;

    protected abstract printSuccess(n: number): void;
}

export class ArrayFlattenerTransform extends ATransform {
    constructor(topFunction: string, silentTransforms = false) {
        super(topFunction, silentTransforms, "array flattening");
    }

    protected applyTransform(): number {
        const flattener = new ArrayFlattener(this.silentTransforms);
        const count = flattener.flattenAll();
        return count;
    }

    protected printSuccess(n: number): void {
        this.log(`Flattened ${n} array${n > 1 ? "s" : ""} into 1D`);
    }
}

export class ConstantFoldingPropagationTransform extends ATransform {
    protected applyTransform(): number {
        let cnt = 0;

        this.getValidFunctions().forEach((fun) => {
            const foldProg = new FoldingPropagationCombiner(this.silentTransforms);
            const nPasses = foldProg.doPassesUntilStop(fun);
            cnt += 1;
            this.log(`Applied constant folding/propagation to function ${fun.name} in ${nPasses} pass${nPasses > 1 ? "es" : ""}`);
        });
        return cnt;
    }

    protected printSuccess(n: number): void {
        this.log(`Applied constant folding/propagation to ${n} function${n > 1 ? "s" : ""}`);
    }
}

export class StructDecompositionTransform extends ATransform {
    protected applyTransform(): number {
        const decomp = new StructDecomposer(this.silentTransforms);
        const structNames = decomp.decomposeAll();

        return structNames.length;
    }

    protected printSuccess(n: number): void {
        this.log(`Decomposed ${n} struct${n > 1 ? "s" : ""}`);
    }
}

export class SwitchToIfTransform extends ATransform {
    protected applyTransform(): number {
        const switchToIf = new SwitchToIf(this.silentTransforms);
        let count = 0;

        for (const switchStmt of Query.search(Switch)) {
            const success = switchToIf.convert(switchStmt);
            if (success) {
                count++;
            }
        }
        return count;
    }

    protected printSuccess(n: number): void {
        this.log(`Converted ${n} switch statement${n == 1 ? "" : "s"} into if-else statements`);
    }
}