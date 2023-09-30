"use strict";

laraImport("estimation/AEstimator");
laraImport("estimation/EstimationTemplateFactory");

class VitisHlsPrecalcEstimator extends AEstimator {
    #precalcEstimations = {};

    constructor(estimationFolder, synthesisResults) {
        super(estimationFolder, "vitishls_precalc", "fpga");

        this.#precalcEstimations = this.readFromFile(synthesisResults);
    }

    estimate(task) {
        const name = task.getName();
        const estim = this.#precalcEstimations[name];

        if (estim === undefined) {
            println(`[VitisHlsPrecalcEstimator] No estimation for task ${name}!`);
            return EstimationTemplateFactory.buildFpgaTemplate();
        }
        return estim;
    }
}