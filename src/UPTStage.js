"use strict";

class UPTStage {
    #stageName = "DefaultStage";
    #padding = 40;
    #appName;
    #outputDir;
    #topFunction;

    constructor(stageName, topFunction, outputDir = "output", appName = "default_app_name") {
        if (new.target === UPTStage) {
            throw new Error("Can't instantiate abstract class.");
        }

        this.#stageName = stageName;
        this.#appName = appName;
        this.#outputDir = outputDir;

        if (typeof topFunction === "string") {
            this.#topFunction = this.findTopFunctionFromName(topFunction);
        }
        else {
            this.#topFunction = topFunction;
        }
    }

    findTopFunctionFromName(topFun) {
        return Query.search("function", { name: topFun }).first();
    }

    setAppName(appName) {
        this.#appName = appName;
    }

    setOutputDir(outputDir) {
        this.#outputDir = outputDir;
    }

    setTopFunction(topFunction) {
        this.#topFunction = topFunction;
    }

    getAppName() {
        return this.#appName;
    }

    getOutputDir() {
        return this.#outputDir;
    }

    getTopFunction() {
        return this.#topFunction;
    }

    log(message) {
        const prefix = "[UPT-" + this.#stageName + "]";
        const padding = this.#padding - prefix.length;
        println(prefix + "-".repeat(padding) + " " + message);
    }

    saveToFile(str, filename) {
        const fullName = `${this.#outputDir}/${this.#appName}_${filename}`;
        Io.writeFile(fullName, str);
        return fullName;
    }
}