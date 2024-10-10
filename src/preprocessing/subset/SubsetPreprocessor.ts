import { AStage } from "../../AStage.js";
import { CodeSanitizer } from "./CodeSanitizer.js";
import { SubsetReducer } from "./SubsetReducer.js";

export class SubsetPreprocessor extends AStage {
    constructor(topFunction: string, outputDir: string, appName: string) {
        super("TransFlow-Subset", topFunction, outputDir, appName);
    }

    preprocess(): boolean {
        this.sanitizeCodePreSubset();

        const success = this.reduceToSubset();
        if (!success) {
            return false;
        }

        this.sanitizeCodePostSubset();
        return true;
    }

    sanitizeCodePreSubset(): void {
        const sanitizer = new CodeSanitizer(this.getTopFunctionName());
        sanitizer.sanitize();
        this.log("Sanitized code before subset reduction");
    }

    reduceToSubset() {
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

    sanitizeCodePostSubset() {
        const sanitizer = new CodeSanitizer(this.getTopFunctionName());
        sanitizer.removeSpuriousStatements();
        sanitizer.removeDuplicatedDecls();
        this.log("Sanitized code after subset reduction");
    }
}