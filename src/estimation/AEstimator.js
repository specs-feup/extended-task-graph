"use strict";

class AEstimator {
    #estimationCache = {};
    #estimationFolder = "";
    #estimatorName = "";

    constructor(estimationFolder, estimatorName) {
        if (new.target === AEstimator) {
            throw new Error("Cannot instantiate an abstract class.");
        }

        this.#estimationFolder = estimationFolder;
        this.#estimatorName = estimatorName;
    }

    estimateTaskGraph(tg, saveToFile = false) {
        this.#estimationCache = {};

        for (const task of tg.getTasksByType("REGULAR")) {
            this.estimateTask(task);
        }

        if (saveToFile) {
            this.saveToFile();
        }
    }

    estimateTask(task, forceUpdate = false) {
        const name = task.getName();
        let estim = {};

        if (this.#estimationCache[name] !== undefined && !forceUpdate) {
            estim = this.#estimationCache[name];
        }
        else {
            estim = this.estimate(task);
            this.#estimationCache[name] = estim;
        }

        task.setProperties(estim);
        return estim;
    }

    saveToFile() {
        const fname = `estim_${this.#estimatorName}.json`;
        Io.writeJson(this.#estimationFolder + "/" + fname, this.#estimationCache);
    }

    readFromFile(pathToEstimation) {
        try {
            const json = Io.readJson(pathToEstimation);
            return json;
        } catch (e) {
            println(`[AEstimator] Could not read estimation file ${pathToEstimation}!`);
            return {};
        }
    }

    estimate(task) {
        throw new Error("Abstract method!");
    }
}