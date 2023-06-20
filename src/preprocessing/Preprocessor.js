"use strict";

laraImport("clava.code.Outliner");
laraImport("preprocessing/SubsetReducer");
laraImport("preprocessing/OutlineRegionFinder");
laraImport("preprocessing/CodeSanitizer");
laraImport("UPTStage");

class Preprocessor extends UPTStage {
    #topFunction;

    constructor(topFunction, outputDir, appName) {
        super("CTFlow-Preprocessor", outputDir, appName);
        this.#topFunction = topFunction;
    }

    preprocess() {
        this.sanitizeCodePreSubset();
        this.reduceToSubset();
        this.sanitizeCodePostSubset();
        this.generateSubsetCode();
        this.outlineRegions();
    }

    sanitizeCodePreSubset() {
        const sanitizer = new CodeSanitizer();
        sanitizer.sanitize();
        this.log("Sanitized code before subset reduction");
    }

    sanitizeCodePostSubset() {
        const sanitizer = new CodeSanitizer();
        sanitizer.removeSpuriousStatements();
        sanitizer.removeDuplicatedDecls();
        this.log("Sanitized code after subset reduction");
    }

    reduceToSubset() {
        const reducer = new SubsetReducer(this.#topFunction);
        reducer.reduce();
        this.log("Successfully reduced the application to a C/C++ subset");
    }

    generateSubsetCode() {
        ClavaUtils.generateCode(this.getOutputDir(), "src_inter_subset");
        this.log("Intermediate subset-reduced source code written to \"src_inter_subset\"");
    }

    outlineRegions() {
        const annot = new OutlineRegionFinder(this.#topFunction);
        const regions = annot.annotate();

        let outCount = 0;
        for (const region of regions) {
            const outliner = new Outliner();
            outliner.setVerbosity(false);
            outliner.setDefaultPrefix("outlined_fun_");
            outliner.outline(region[0], region[region.length - 1]);

            region[0].detach();
            region[region.length - 1].detach();
            outCount++;
        }
        this.log("Outlined " + outCount + " regions");
        this.log("Finished outlining regions");
    }

}