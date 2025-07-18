import { SourceCodeOutput } from "../../api/OutputDirectories.js";
import { AStage } from "../../AStage.js";
import { CodeSanitizer } from "./CodeSanitizer.js";
import { SubsetTransform, transformMap } from "./SubsetTransforms.js";
import { SubsetReducer } from "./SubsetReducer.js";

export class SubsetPreprocessor extends AStage {
    private intermediateDir: string;

    public static readonly DEFAULT_RECIPE: SubsetTransform[] = [
        SubsetTransform.ArrayFlattener,
        SubsetTransform.ConstantFoldingPropagation,
        SubsetTransform.StructDecomposition,
        SubsetTransform.SwitchToIf,
        SubsetTransform.ConstantFoldingPropagation
    ];

    constructor(topFunction: string, outputDir: string, appName: string) {
        super("TransFlow-Subset", topFunction, outputDir, appName);
        this.intermediateDir = `${SourceCodeOutput.SRC_PARENT}/${SourceCodeOutput.SRC_INTERMEDIATE}`;
    }

    public preprocess(recipe: SubsetTransform[] = SubsetPreprocessor.DEFAULT_RECIPE, silentTransforms = false): boolean {
        this.deleteFolderContents(this.intermediateDir);

        this.sanitizeCodePreSubset();

        const success = this.reduceToSubset();
        if (!success) {
            return false;
        }

        this.sanitizeCodePostSubset();

        this.generateCode(`${this.intermediateDir}-t0-normalization`);

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
        let transCnt = 0;

        for (const transform of recipe) {
            const transformClass = transformMap[transform];
            const transformInstance = new transformClass(this.getTopFunctionName(), silentTransforms);
            const res = transformInstance.apply();
            const success = res[0];
            const msg = res[1];
            transCnt++;

            const id = `t${transCnt}-${transformInstance.getName()}`;
            const dir = `${this.intermediateDir}-${id}`;
            if (success) {
                this.generateCode(dir);
            }
            else {
                const filename = "failure.txt";
                const fullPath = `${dir}/${filename}`;

                this.generateFile(fullPath, msg);
            }
        }
        this.log("Applied all required code transformations");
    }
}

export { SubsetTransform };
