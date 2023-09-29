"use strict";

laraImport("UPTStage");
laraImport("estimation/PerfPrecalcEstimator");
laraImport("estimation/VitisHlsPrecalcEstimator");
laraImport("estimation/VitisHlsRealtimeEstimator");

class TaskGraphAnnotator extends UPTStage {

    constructor(topFunction, outputDir, appName) {
        super("HPFlow-TaskGraphAnnotator", topFunction, outputDir, appName);
    }

    annotateAll(taskGraph, config) {
        const cpuEstim = config["cpuEstim"];
        this.annotateCpuEstimations(taskGraph, cpuEstim);

        if (config["useHls"]) {
            const targetPart = config["targetPart"];
            const period = config["period"];
            this.annotateFpgaEstimationsRealtime(taskGraph, targetPart, period);
        }
        else {
            const fpgaEstim = config["fpgaEstim"];
            this.annotateFpgaEstimationsPrecalculated(taskGraph, fpgaEstim);
        }
    }

    annotateCpuEstimations(taskGraph, profilingResults) {
        const estimator = new PerfPrecalcEstimator(this.getOutputDir(), profilingResults);
        estimator.estimateTaskGraph(taskGraph, true);
    }

    annotateFpgaEstimationsPrecalculated(taskGraph, synthesisResults) {
        const estimator = new VitisHlsPrecalcEstimator(this.getOutputDir(), synthesisResults);
        estimator.estimateTaskGraph(taskGraph, true);
    }

    annotateFpgaEstimationsRealtime(taskGraph, targetPart, period) {
        const estimator = new VitisHlsRealtimeEstimator(this.getOutputDir(), targetPart, period);
        estimator.estimateTaskGraph(taskGraph, true);
    }
}