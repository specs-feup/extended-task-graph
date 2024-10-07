"use strict";

laraImport("flextask/taskgraph/DotConverter");

class DotConverterMinimal extends DotConverter {

    constructor() {
        super();
    }

    getLabelOfEdge() {
        return "";
    }

}