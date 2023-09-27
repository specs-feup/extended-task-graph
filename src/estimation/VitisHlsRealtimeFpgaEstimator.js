"use strict";

class VitisHlsRealtimeFpgaEstimator extends ARealtimeFpgaEstimator {
    constructor() {
        super();
    }

    callHlsTool(topFunction) {
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

    estimateTask(task) {
        const topFunction = task.getName();
        const report = this.callHlsTool(topFunction);

        const time = report["latencyWorst"];
        const resources = {
            "FF": report["perFF"],
            "LUT": report["perLUT"],
            "BRAM": report["perBRAM"],
            "DSP": report["perDSP"]
        };
        this.updateTaskWithFpgaInfo(task, time, resources);
    }
}