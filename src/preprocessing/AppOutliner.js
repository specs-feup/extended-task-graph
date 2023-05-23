"use strict";

laraImport("clava.code.Outliner");
laraImport("weaver.Query");
laraImport("UPTStage");

class AppOutliner extends UPTStage {

    constructor() {
        super("Preprocessor-AppOutliner");
    }

    outline() {
        this.log("Beginning outlining regions");
        const outliner = new Outliner();
        outliner.setVerbosity(true);
        this.log("Finished outlining regions")
    }
}