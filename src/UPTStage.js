"use strict";

class UPTStage {
    #stageName = "DefaultStage";
    #padding = 40;
    #appName;
    #outputDir;

    constructor(stageName, outputDir = "output", appName = "default_app_name") {
        if (new.target === UPTStage) {
            throw new Error("Can't instantiate abstract class.");
        }

        this.#stageName = stageName;
        this.#appName = appName;
        this.#outputDir = outputDir;
    }

    setAppName(appName) {
        this.#appName = appName;
    }

    setOutputDir(outputDir) {
        this.#outputDir = outputDir;
    }

    getAppName() {
        return this.#appName;
    }

    getOutputDir() {
        return this.#outputDir;
    }

    log(message) {
        const prefix = "[UPT-" + this.#stageName + "]";
        const padding = this.#padding - prefix.length;
        println(prefix + "-".repeat(padding) + " " + message);
    }

    saveToFile(str, filename) {
        Io.writeFile(this.#outputDir + "/" + this.#appName + "_" + filename, str);
    }
}