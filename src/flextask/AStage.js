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
        const coloredName = Chalk.color(fullName, "cyan");

        const header = `[${coloredName}] `.padEnd(this.#padding, '-');
        return header;
    }

    log(message) {
        const header = this.#getStageOutputHeader();
        println(`${header} ${message}`);
    }

    logOutput(message, path) {
        const header = this.#getStageOutputHeader();

        let minPath = path;
        const subpaths = Object.values(OutputDirectories);
        for (const subpath of subpaths) {
            if (path.includes(subpath)) {
                minPath = path.substring(path.indexOf(subpath));
                break;
            }
        }

        let prettyPath = Chalk.style(minPath, "italic");
        prettyPath = Chalk.color(prettyPath, "blue");

        println(`${header} ${message} ${prettyPath}`);
    }

    logSuccess(message) {
        const header = this.#getStageOutputHeader();
        const success = Chalk.color("Success: ", "green");
        println(`${header} ${success} ${message}`);
    }

    logWarning(message) {
        const header = this.#getStageOutputHeader();
        const warning = Chalk.color("Warning: ", "yellow");
        println(`${header} ${warning} ${message}`);
    }

    logError(message) {
        const header = this.#getStageOutputHeader();
        const err = Chalk.color("Error: ", "red");
        println(`${header} ${err} ${message}`);
    }

    logTrace(exception) {
        const header = this.#getStageOutputHeader();
        const err = Chalk.color("Exception caught with stack trace:", "red");
        const end = Chalk.color("----------------------------------", "red");

        println(`${header} ${err}`);
        println(exception.stack);
        println(`${header} ${end}`);
    }

    logLine() {
        const header = this.#getStageOutputHeader();
        println(`${header}${"-".repeat(58)}`);
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