"use strict";

laraImport("UPTStage");
laraImport("estimation/PerfPrecalcEstimator");
laraImport("estimation/VitisHlsPrecalcEstimator");

class TaskGraphAnnotator extends UPTStage {

    constructor(topFunction, outputDir, appName) {
        super("HPFlow-TaskGraphAnnotator", topFunction, outputDir, appName);
    }

    annotateCpuEstimations(taskGraph, profilingResults) {
        const estimator = new PerfPrecalcEstimator(this.getOutputDir(), profilingResults);
        estimator.estimateTaskGraph(taskGraph, true);
    }

    annotateFpgaEstimations(taskGraph, synthesisResults) {
        const estimator = new VitisHlsPrecalcEstimator(this.getOutputDir(), synthesisResults);
        estimator.estimateTaskGraph(taskGraph, true);
    }
}