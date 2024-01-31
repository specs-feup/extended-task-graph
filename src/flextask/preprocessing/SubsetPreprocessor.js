"use strict";

laraImport("flextask/preprocessing/SubsetReducer");
laraImport("flextask/preprocessing/CodeSanitizer");
laraImport("flextask/AStage");

class SubsetPreprocessor extends AStage {
    constructor(topFunction, outputDir, appName) {
        super("CTFlow-SubsetPreprocessor", topFunction, outputDir, appName);
    }

    preprocess() {
        this.sanitizeCodePreSubset();
        this.reduceToSubset();
        this.sanitizeCodePostSubset();
    }

    sanitizeCodePreSubset() {
        const sanitizer = new CodeSanitizer(this.getTopFunctionName());
        sanitizer.sanitize();
        this.log("Sanitized code before subset reduction");
    }

    reduceToSubset() {
        const reducer = new SubsetReducer(this.getTopFunctionName());
        reducer.reduce();
        this.log("Successfully reduced the application to a C/C++ subset");
    }

    sanitizeCodePostSubset() {
        const sanitizer = new CodeSanitizer(this.getTopFunctionName());
        sanitizer.removeSpuriousStatements();
        sanitizer.removeDuplicatedDecls();
        this.log("Sanitized code after subset reduction");
    }
}