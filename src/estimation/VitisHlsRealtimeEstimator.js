"use strict";

laraImport("estimation/AEstimator");
laraImport("estimation/EstimationTemplateFactory");

class VitisHlsRealtimeEstimator extends AEstimator {
    constructor(estimationFolder, targetPart, period) {
        super(estimationFolder, "vitishls_realtime");
    }

    estimate(task) {
        const name = task.getName();
        const synthReport = this.#callVitisHls(name);
        const estim = this.#parseReport(synthReport);

        if (estim === undefined) {
            println(`[VitisHlsPrecalcEstimator] No estimation for task ${name}!`);
            return EstimationTemplateFactory.buildFpgaTemplate();
        }
        return estim;
    }

    #callVitisHls(topFunction) {
        return {
            "platform": "xcvu5p-flva2104-1-e",      // target platform
            "topFun": "foo",                        // top function
            "clockTarget": "5.00",                  // target clock frequency (Hz)
            "clockEstim": "3.650",                  // estimated clock frequency (Hz)
            "fmax": 273.972602739726,               // maximum clock frequency (Hz)
            "latencyWorst": "3651992",              // worst estimated latency (cycles)
            "latencyAvg": "3651992",                // average estimated latency (cycles)
            "latencyBest": "3651992",               // best estimated latency (cycles)
            "hasFixedLatency": true,                // if latency was successfully estimated
            "execTimeWorst": 0.013329770800000001,  // obtained from latencyWorst and estimated clock (s)
            "execTimeAvg": 0.013329770800000001,    // same
            "execTimeBest": 0.013329770800000001,   // same
            "FF": "31171",                          // # of Flip-flops
            "LUT": "48187",                         // # of Lookup Tables
            "BRAM": "4368",                         // # of Block RAMs
            "DSP": "23",                            // # of DSPs
            "availFF": "1201154",                   // # of available Flip-flops on the target
            "availLUT": "600577",                   // # of available Lookup Tables on the target
            "availBRAM": "2048",                    // # of available Block RAMs on the target
            "availDSP": "3474",                     // # of available DSPs on the target
            "perFF": 0.025950877239721136,          // % of Flip-flops used by the design (0 to 100)
            "perLUT": 0.08023450781498459,          // % of Lookup Tables used by the design (0 to 100)
            "perBRAM": 2.1328125,                   // % of Block RAMs used by the design (0 to 100)
            "perDSP": 0.006620610247553253          // % of DSPs used by the design (0 to 100)
        }
    }

    #parseReport(report) {
        const template = EstimationTemplateFactory.buildFpgaTemplate();

        template.fpgaTime = report.execTimeAvg;
        template.resources.FF = report.FF;
        template.resources.LUT = report.LUT;
        template.resources.BRAM = report.BRAM;
        template.resources.DSP = report.DSP;
        template.target = report.platform;
        template.period = 1 / report.clockEstim;

        return template;
    }

}