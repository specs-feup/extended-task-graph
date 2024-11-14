import { AStage } from "../../AStage.js";
import { CodeSanitizer } from "./CodeSanitizer.js";
import { ArrayFlattenerTransform, ConstantFoldingPropagationTransform, StructDecompositionTransform, SwitchToIfTransform } from "./CodeTransformer.js";
import { SubsetReducer } from "./SubsetReducer.js";

export enum SubsetTransform {
    ArrayFlattener = "ArrayFlattener",
    ConstantFoldingPropagation = "ConstantFoldingPropagation",
    StructDecomposition = "StructDecomposition",
    SwitchToIf = "SwitchToIf"
}

const classMap = {
    [SubsetTransform.ArrayFlattener]: ArrayFlattenerTransform,
    [SubsetTransform.ConstantFoldingPropagation]: ConstantFoldingPropagationTransform,
    [SubsetTransform.StructDecomposition]: StructDecompositionTransform,
    [SubsetTransform.SwitchToIf]: SwitchToIfTransform
}

export class SubsetPreprocessor extends AStage {
    public static readonly DEFAULT_RECIPE: SubsetTransform[] = [
        SubsetTransform.ArrayFlattener,
        SubsetTransform.ConstantFoldingPropagation,
        SubsetTransform.StructDecomposition,
        SubsetTransform.SwitchToIf,
        SubsetTransform.ConstantFoldingPropagation
    ];

    constructor(topFunction: string, outputDir: string, appName: string) {
        super("TransFlow-Subset", topFunction, outputDir, appName);
    }

    public preprocess(recipe: SubsetTransform[] = SubsetPreprocessor.DEFAULT_RECIPE, silentTransforms = false): boolean {
        this.sanitizeCodePreSubset();

        const success = this.reduceToSubset();
        if (!success) {
            return false;
        }

        this.sanitizeCodePostSubset();

        this.applyCodeTransformations(recipe, silentTransforms);
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

    public applyCodeTransformations(recipe: SubsetTransform[], silentTransforms = false) {
        for (const transform of recipe) {
            const transformClass = classMap[transform];
            const transformInstance = new transformClass(this.getTopFunctionName(), silentTransforms);
            transformInstance.apply();
        }
        this.log("Applied all required code transformations");
    }
}