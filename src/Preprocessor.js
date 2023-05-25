"use strict";

laraImport("clava.code.Outliner");
laraImport("preprocessing/SubsetReducer");
laraImport("preprocessing/OutlineAnnotator");
laraImport("UPTStage");

class Preprocessor extends UPTStage {
    #starterFunction;

    constructor(starterFunction) {
        super("Preprocessor");
        this.#starterFunction = starterFunction;
    }

    preprocess() {
        this.reduceToSubset();
        this.outlineRegions();
    }

    reduceToSubset() {
        const reducer = new SubsetReducer();
        reducer.reduce();
        this.log("Subset reduction finished successfully");
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