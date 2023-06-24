"use strict";

laraImport("clava.code.Outliner");
laraImport("preprocessing/SubsetReducer");
laraImport("preprocessing/OutlineRegionFinder");
laraImport("preprocessing/CodeSanitizer");
laraImport("preprocessing/AppTimerInserter");
laraImport("UPTStage");

class Preprocessor extends UPTStage {
    constructor(topFunction, outputDir, appName) {
        super("CTFlow-Preprocessor", topFunction, outputDir, appName);
    }

    preprocess() {
        this.sanitizeCodePreSubset();
        this.reduceToSubset();
        this.sanitizeCodePostSubset();
        this.generateSubsetCode();
        this.outlineRegions();
        this.insertTimer();
    }

    sanitizeCodePreSubset() {
        const sanitizer = new CodeSanitizer(this.getTopFunction());
        sanitizer.sanitize();
        this.log("Sanitized code before subset reduction");
    }

    sanitizeCodePostSubset() {
        const sanitizer = new CodeSanitizer(this.getTopFunction());
        sanitizer.removeSpuriousStatements();
        sanitizer.removeDuplicatedDecls();
        this.log("Sanitized code after subset reduction");
    }

    reduceToSubset() {
        const reducer = new SubsetReducer(this.getTopFunction());
        reducer.reduce();
        this.log("Successfully reduced the application to a C/C++ subset");
    }

    generateSubsetCode() {
        ClavaUtils.generateCode(this.getOutputDir(), "src_inter_subset");
        this.log("Intermediate subset-reduced source code written to \"src_inter_subset\"");
    }

    outlineRegions() {
        const annot = new OutlineRegionFinder(this.getTopFunction());
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

    insertTimer() {
        const timerInserter = new AppTimerInserter();
        const couldInsert = timerInserter.insertTimer(this.getTopFunction());
        const topFunName = this.getTopFunction().name;

        if (!couldInsert) {
            this.log(`Could not insert timer around application starting point "${topFunName}"`);
        }
        else {
            this.log(`Inserted timer around application starting point "${topFunName}"`);
        }
    }
}