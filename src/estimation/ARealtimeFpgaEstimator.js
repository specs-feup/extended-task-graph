"use strict";

class ACpuEstimator extends AEstimator {
    constructor() {
        super();
    }

    callHlsTool(task) {
        throw new Error("Abstract method must be overridden.");
    }
}