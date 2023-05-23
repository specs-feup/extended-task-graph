"use strict";

laraImport("preprocessing/SubsetReducer");
laraImport("preprocessing/AppOutliner");
laraImport("UPTStage");

class Preprocessor extends UPTStage {
    constructor() {
        super("Preprocessor");
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
        const appOut = new AppOutliner();
        appOut.outline();
        this.log("Region outlining finished successfully");
    }

}