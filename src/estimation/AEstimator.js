"use strict";

class AEstimator {
    #estimationCache = {};
    #estimationFolder = "";
    #estimatorName = "";
    #prefix = "";

    constructor(estimationFolder, estimatorName, prefix) {
        if (new.target === AEstimator) {
            throw new Error("Cannot instantiate an abstract class.");
        }

        this.#estimationFolder = estimationFolder;
        this.#estimatorName = estimatorName;
        this.#prefix = prefix;
    }

    getEstimationFolder() {
        return this.#estimationFolder;
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

        task.setProperty(this.#prefix, estim);
        return estim;
    }

    saveToFile() {
        const fname = `estim_${this.#estimatorName}.json`;
        Io.writeJson(this.#estimationFolder + "/" + fname, this.#estimationCache);
        println(`[${this.constructor.name}] Estimations saved to ${fname}`);
    }

    readFromFile(pathToEstimation) {
        let json = {};

        if (Io.isFile(pathToEstimation)) {
            json = Io.readJson(pathToEstimation);
        }
        return json;
    }

    estimate(task) {
        throw new Error("Abstract method!");
    }
}