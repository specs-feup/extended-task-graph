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
            "fpgaTime": -1,
            "resources": {
                "FF": -1,
                "LUT": -1,
                "BRAM": -1,
                "DSP": -1
            },
            "target": "none",
            "period": -1
        };
        return template;
    }
}