"use strict";

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
        this.log("Region outlining finished successfully");
    }

}