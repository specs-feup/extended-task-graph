"use strict";

laraImport("estimation/AEstimator");
laraImport("estimation/EstimationTemplateFactory");
//laraImport("clava.vitis.VitisHls");

class VitisHlsRealtimeEstimator extends AEstimator {
    targetPart = "";
    period = 0;
    inputFolder = "";

    constructor(estimationFolder, targetPart, period, inputFolder) {
        super(estimationFolder, "vitishls_realtime", "fpga");
        this.targetPart = targetPart;
        this.period = period;
        this.inputFolder = inputFolder;
    }

    estimate(task) {
        const name = task.getName();
        const synthReport = this.#callVitisHls(name);

        if (synthReport === undefined || Object.entries(synthReport).length === 0) {
            println(`[VitisHlsPrecalcEstimator] No estimation available for task ${name}!`);
            return EstimationTemplateFactory.buildFpgaTemplate();
        }

        const estim = this.#parseReport(synthReport);
        return estim;
    }

    #callVitisHls(topFunction) {
        const vitis = new VitisHls();
        vitis.setWorkingDir(this.getEstimationFolder() + "/vitis_hls_working_dir");
        vitis.setProjectName("vitis_hls_estimation_proj");

        vitis.setTopFunction(topFunction);
        vitis.setPlatform(this.targetPart);
        vitis.setClock(this.period);
        vitis.setFlowTarget("vitis");

        vitis.addSourcesInFolder(this.inputFolder, true);

        const success = vitis.synthesize();

        if (success) {
            const report = vitis.getSynthesisReport();
            return report;
        }
        else {
            println(`[VitisHlsPrecalcEstimator] Error in synthesis of task ${topFunction}!`);
            return {};
        }
    }

    #parseReport(report) {
        const template = EstimationTemplateFactory.buildFpgaTemplate();

        template["execBest"] = report["execTimeBest"];
        template["execWorst"] = report["execTimeWorst"];

        template["platform"] = report["platform"];
        template["clockTarget"] = report["clockTarget"];
        template["clockEstim"] = report["clockEstim"];
        template["fmax"] = report["fmax"];

        template["latencyBest"] = report["latencyBest"];
        template["latencyWorst"] = report["latencyWorst"];
        template["hasFixedLatency"] = report["hasFixedLatency"];

        template["resources"]["FF"] = report["FF"];
        template["resources"]["LUT"] = report["LUT"];
        template["resources"]["BRAM"] = report["BRAM"];
        template["resources"]["DSP"] = report["DSP"];

        template["resources"]["perFF"] = report["perFF"];
        template["resources"]["perLUT"] = report["perLUT"];
        template["resources"]["perBRAM"] = report["perBRAM"];
        template["resources"]["perDSP"] = report["perDSP"];

        return template;
    }

}