"use strict";

laraImport("flextask/taskgraph/DotConverter");

class DotConverterPerf extends DotConverter {

    constructor() {
        super();
    }

    getLabelOfTask(task) {
        let label = super.getLabelOfTask(task);

        const cpuPerf = task.getAnnotation("cpu");
        const fpgaPerf = task.getAnnotation("fpga");

        if (cpuPerf == null || fpgaPerf == null) {
            return label;
        }

        label += `\n-------------------\n`;
        label += `CPU Time: ${this.#secToUsec(cpuPerf.cpuTime)}\n`;
        label += `FPGA Time: ${this.#secToUsec(fpgaPerf.execBest)}\n`;
        label += `\nFF | LUT | BRAM | DSP\n`;
        label += `${this.#toPercent(fpgaPerf.resources.perFF)} |`;
        label += `${this.#toPercent(fpgaPerf.resources.perLUT)} |`;
        label += `${this.#toPercent(fpgaPerf.resources.perBRAM)} |`;
        label += `${this.#toPercent(fpgaPerf.resources.perDSP)}`;
        return label;
    }

    #toPercent(value, precision = 1) {
        return `${(value * 100).toFixed(precision)}%`;
    }

    #secToUsec(seconds, precision = 1) {
        if (seconds == -1 || seconds == null) {
            return "N/A";
        }
        return `${(seconds * 1000000).toFixed(precision)}us`
    }

}