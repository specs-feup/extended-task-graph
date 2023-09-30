"use strict";

class EstimationTemplateFactory {
    static buildCpuTemplate() {
        const template = {
            "cpuTime": -1
        };
        return template;
    }

    static buildFpgaTemplate() {
        const template = {
            "execBest": -1,
            "execWorst": -1,

            "platform": "none",
            "clockTarget": -1,
            "clockEstim": -1,
            "fmax": -1,

            "latencyBest": -1,
            "latencyWorst": -1,
            "hasFixedLatency": true,

            "resources": {
                "FF": -1,
                "LUT": -1,
                "BRAM": -1,
                "DSP": -1,

                "perFF": -1,
                "perLUT": -1,
                "perBRAM": -1,
                "perDSP": -1,
            },
        };
        return template;
    }
}