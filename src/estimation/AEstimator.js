"use strict";

class AEstimator {
    constructor() {
        if (new.target === AbstractClass) {
            throw new Error("Cannot instantiate an abstract class.");
        }
    }

    estimateTaskGraph(tg) {
        for (const task of tg.getTasksByType("REGULAR")) {
            this.estimateTask(task);
        }
    }

    estimateTask(task) {
        throw new Error("Abstract method must be overridden.");
    }
}