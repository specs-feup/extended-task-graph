"use strict";

laraImport("preprocessing/SubsetReducer");
laraImport("preprocessing/AppOutliner");

class Preprocessor {
    constructor() { }

    preprocess() {
        this.reduceToSubset();
        this.outlineRegions();
    }

    reduceToSubset() {
        const reducer = new SubsetReducer();
        reducer.reduce();
    }

    outlineRegions() {
        const appOut = new AppOutliner();
        appOut.outline();
    }

}