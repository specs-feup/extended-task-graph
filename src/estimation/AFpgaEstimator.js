"use strict";

class AFpgaEstimator extends AEstimator {
    constructor() {
        super();
    }

    updateTaskWithFpgaInfo(task, fpgaTime, resources) {
        task.setProperty("fpgaTime", fpgaTime);
        task.setProperty("fpgaResources", resources);
    }
}