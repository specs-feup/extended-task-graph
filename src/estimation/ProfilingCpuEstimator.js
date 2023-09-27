"use strict";

class ProfilingCpuEstimator extends ACpuEstimator {
    constructor(profilingResults) {
        super();
        this.profilingResults = profilingResults;
    }

    estimateTask(task) {
        const taskName = task.getName();
        //const taskTime = this.profilingResults[taskName];
        const taskTime = 0.0;
        this.updateTaskWithCpuInfo(task, taskTime);
    }
}