import { AStage } from "../../AStage.js";
import { CodeSanitizer } from "./CodeSanitizer.js";
import { ArrayFlattenerTransform, ConstantFoldingPropagationTransform, StructDecompositionTransform, SwitchToIfTransform } from "./CodeTransformer.js";
import { SubsetReducer } from "./SubsetReducer.js";

export enum Transform {
    ArrayFlattener = "ArrayFlattener",
    ConstantFoldingPropagation = "ConstantFoldingPropagation",
    StructDecomposition = "StructDecomposition",
    SwitchToIf = "SwitchToIf"
}

const classMap = {
    [Transform.ArrayFlattener]: ArrayFlattenerTransform,
    [Transform.ConstantFoldingPropagation]: ConstantFoldingPropagationTransform,
    [Transform.StructDecomposition]: StructDecompositionTransform,
    [Transform.SwitchToIf]: SwitchToIfTransform
}

export class SubsetPreprocessor extends AStage {
    public static readonly DEFAULT_RECIPE: Transform[] = [
        Transform.ArrayFlattener,
        Transform.ConstantFoldingPropagation,
        Transform.StructDecomposition,
        Transform.SwitchToIf,
        Transform.ConstantFoldingPropagation
    ];

    constructor(topFunction: string, outputDir: string, appName: string) {
        super("TransFlow-Subset", topFunction, outputDir, appName);
    }

    public preprocess(recipe: Transform[] = SubsetPreprocessor.DEFAULT_RECIPE): boolean {
        this.sanitizeCodePreSubset();

        const success = this.reduceToSubset();
        if (!success) {
            return false;
        }

        this.sanitizeCodePostSubset();

        this.applyCodeTransformations(recipe);
        return true;
    }

    public sanitizeCodePreSubset(): void {
        const sanitizer = new CodeSanitizer(this.getTopFunctionName());
        sanitizer.sanitize();
        this.log("Sanitized code before subset reduction");
    }

    public reduceToSubset() {
        const reducer = new SubsetReducer(this.getTopFunctionName());
        try {
            reducer.reduce();
            this.log("Successfully reduced the application to a C/C++ subset");
            return true;
        }
        catch (e) {
            this.logTrace(e);
            this.logError("Failed to reduce the application to a C/C++ subset");
            return false;
        }
    }

    public sanitizeCodePostSubset() {
        const sanitizer = new CodeSanitizer(this.getTopFunctionName());
        sanitizer.removeSpuriousStatements();
        sanitizer.removeDuplicatedDecls();
        this.log("Sanitized code after subset reduction");
    }

    public applyCodeTransformations(recipe: Transform[], silentTransforms = false) {
        for (const transform of recipe) {
            const transformClass = classMap[transform];
            const transformInstance = new transformClass(this.getTopFunctionName(), silentTransforms);
            transformInstance.apply();
        }
        this.log("Applied all required code transformations");
    }
}