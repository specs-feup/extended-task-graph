"use strict";

laraImport("flextask/util/Chalk");

class AStage {
    #stageName = "DefaultStage";
    #padding = 50;
    #topFunctionName;
    #appName;
    #outputDir;

    constructor(stageName, topFunctionName, outputDir = "output", appName = "default_app_name") {
        if (new.target === AStage) {
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
        return Query.search("function", { name: this.getTopFunctionName(), isImplementation: true }).first();
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

    #getStageOutputHeader() {
        const fullName = `FTG-${this.#stageName}`;
        const coloredName = Chalk.color(fullName, "blue");

        const header = `[${coloredName}] `.padEnd(this.#padding, '-');
        return header;
    }

    log(message) {
        const header = this.#getStageOutputHeader();
        println(`${header} ${message}`);
    }

    warn(message) {
        const header = this.#getStageOutputHeader();
        const warning = Chalk.color("Warning: ", "yellow");
        println(`${header} ${warning} ${message}`);
    }

    showTrace(exception) {
        const header = this.#getStageOutputHeader();
        const err = Chalk.color("Exception caught with stack trace:", "red");
        const end = Chalk.color("----------------------------------", "red");

        println(`${header} ${err}`);
        println(exception.stack);
        println(`${header} ${end}`);
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