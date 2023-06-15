"use strict";

laraImport("clava.code.Outliner");
laraImport("preprocessing/SubsetReducer");
laraImport("preprocessing/OutlineAnnotator");
laraImport("preprocessing/CodeSanitizer");
//laraImport("util/ClavaUtils");
laraImport("UPTStage");

class Preprocessor extends UPTStage {
    #starterFunction;

    constructor(starterFunction, outputDir, appName) {
        super("Preprocessor", outputDir, appName);
        this.#starterFunction = starterFunction;
    }

    preprocess() {
        this.sanitizeCode();
        this.reduceToSubset();
        this.generateSubsetCode();
        this.outlineRegions();
    }

    sanitizeCode() {
        const sanitizer = new CodeSanitizer();
        sanitizer.sanitize();
        this.log("Code sanitization finished successfully");
    }

    reduceToSubset() {
        const reducer = new SubsetReducer();
        reducer.reduce();
        this.log("Subset reduction finished successfully");
    }

    generateSubsetCode() {
        ClavaUtils.generateCode(this.getOutputDir(), "src_inter_subset");
        this.log("Intermediate subset-reduced source code written to \"src_inter_subset\"");
    }

    outlineRegions() {
        const annot = new OutlineAnnotator(this.#starterFunction);
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
        this.log("Region outlining finished successfully");
    }

}