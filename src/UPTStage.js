"use strict";

class UPTStage {
    #stageName = "DefaultStage";
    #padding = 40;
    #topFunctionName;
    #appName;
    #outputDir;

    constructor(stageName, topFunctionName, outputDir = "output", appName = "default_app_name") {
        if (new.target === UPTStage) {
            throw new Error("Can't instantiate abstract class.");
        }

        this.#stageName = stageName;
        this.#topFunctionName = topFunctionName;
        this.#appName = appName;
        this.#outputDir = outputDir;
    }

    getTopFunction() {
        println("!!!!!! getTopFunction() is deprecated, use getTopFunctionJoinPoint() instead !!!!!!");
        return this.getTopFunctionJoinPoint();
    }

    getTopFunctionJoinPoint() {
        return Query.search("function", { name: this.getTopFunctionName() }).first();
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

    getTopFunctionName() {
        return this.#topFunctionName;
    }

    log(message) {
        const prefix = "[UPT-" + this.#stageName + "]";
        const padding = this.#padding - prefix.length;
        println(prefix + "-".repeat(padding) + " " + message);
    }

    saveToFile(content, filename) {
        const fullName = `${this.#outputDir}/${this.#appName}_${filename}`;
        Io.writeFile(fullName, content);
        return fullName;
    }

    saveToFileInSubfolder(content, filename, subfolder) {
        const fullName = `${this.#outputDir}/${subfolder}/${this.#appName}_${filename}`;
        Io.writeFile(fullName, content);
        return fullName;
    }
}