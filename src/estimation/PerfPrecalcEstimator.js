"use strict";

laraImport("estimation/AEstimator");
laraImport("estimation/EstimationTemplateFactory");

class PerfPrecalcEstimator extends AEstimator {
    #precalcEstimations = {};

    constructor(estimationFolder, profilingResults) {
        super(estimationFolder, "perf_precalc");

        this.#precalcEstimations = this.readFromFile(profilingResults);
    }

    estimate(task) {
        const name = task.getName();
        const estim = this.#precalcEstimations[name];

        if (estim === undefined) {
            println(`[PerfPrecalcEstimator] No estimation for task ${name}!`);
            return EstimationTemplateFactory.buildCpuTemplate();
        }
        return estim;
    }
}