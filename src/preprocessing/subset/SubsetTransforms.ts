import { AStage } from "../../AStage.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import { FunctionJp, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { ArrayFlattener } from "clava-code-transforms/ArrayFlattener";
import { StructDecomposer } from "clava-code-transforms/StructDecomposer";
import { SwitchToIf } from "clava-code-transforms/SwitchToIf";
import { FoldingPropagationCombiner } from "clava-code-transforms/FoldingPropagationCombiner";
import Clava from "@specs-feup/clava/api/clava/Clava.js";

export abstract class ACodeTransform extends AStage {
    protected outputFriendlyName;
    protected silent: boolean;

    constructor(topFunction: string, silent: boolean, outputFriendlyName: string = "Transform") {
        super("TransFlow-Subset-CodeTransform", topFunction);
        this.outputFriendlyName = outputFriendlyName;
        this.silent = silent;
    }

    public apply(): [boolean, string] {
        try {
            Clava.pushAst();

            const count = this.applyTransform();

            const valid = Clava.rebuild();
            if (!valid) {
                this.logError(`Error rebuilding AST after ${this.outputFriendlyName}, reverting AST to previous state`);

                Clava.popAst();
                return [false, "Error rebuilding AST"];
            }
            this.printSuccess(count);

            Clava.clearAstHistory();
            return [true, ""];
        }
        catch (e) {
            const trace = this.logTrace(e);
            this.logError(`Error applying ${this.outputFriendlyName}, reverting AST to previous state`);

            Clava.popAst();
            return [false, trace];
        }
    }

    public getOutputFriendlyName(): string {
        return this.outputFriendlyName;
    }

    public getName(): string {
        return this.outputFriendlyName
            .toLowerCase()
            .replace(/[/\\?%*:|"<>]/g, '-')
            .replace(" ", "-")
            .trim();
    }

    protected getValidFunctions(): FunctionJp[] {
        return ClavaUtils.getAllUniqueFunctions(this.getTopFunctionJoinPoint());
    }

    protected abstract applyTransform(): number;

    protected abstract printSuccess(n: number): void;
}

export class ArrayFlattenerTransform extends ACodeTransform {
    constructor(topFunction: string, silentTransforms = false) {
        super(topFunction, silentTransforms, "array flattening");
    }

    protected applyTransform(): number {
        const flattener = new ArrayFlattener(this.silent);
        const count = flattener.flattenAll();
        return count;
    }

    protected printSuccess(n: number): void {
        this.log(`Flattened ${n} array${n > 1 ? "s" : ""} into 1D`);
    }
}

export class ConstantFoldingPropagationTransform extends ACodeTransform {
    constructor(topFunction: string, silentTransforms = false) {
        super(topFunction, silentTransforms, "constant folding/propagation");
    }

    protected applyTransform(): number {
        let cnt = 0;

        this.getValidFunctions().forEach((fun) => {
            const foldProg = new FoldingPropagationCombiner(this.silent);
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

export class StructDecompositionTransform extends ACodeTransform {
    constructor(topFunction: string, silentTransforms = false) {
        super(topFunction, silentTransforms, "struct decomposition");
    }

    protected applyTransform(): number {
        const decomp = new StructDecomposer(this.silent);
        const structNames = decomp.decomposeAll();

        return structNames.length;
    }

    protected printSuccess(n: number): void {
        this.log(`Decomposed ${n} struct${n > 1 ? "s" : ""}`);
    }
}

export class SwitchToIfTransform extends ACodeTransform {
    constructor(topFunction: string, silentTransforms = false) {
        super(topFunction, silentTransforms, "switch to if-else");
    }

    protected applyTransform(): number {
        const switchToIf = new SwitchToIf(this.silent);
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

export enum SubsetTransform {
    ArrayFlattener = "ArrayFlattener",
    ConstantFoldingPropagation = "ConstantFoldingPropagation",
    StructDecomposition = "StructDecomposition",
    SwitchToIf = "SwitchToIf"
}

export const transformMap = {
    [SubsetTransform.ArrayFlattener]: ArrayFlattenerTransform,
    [SubsetTransform.ConstantFoldingPropagation]: ConstantFoldingPropagationTransform,
    [SubsetTransform.StructDecomposition]: StructDecompositionTransform,
    [SubsetTransform.SwitchToIf]: SwitchToIfTransform
}