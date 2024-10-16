"use strict";

laraImport("lara.Io");
laraImport("flextask/util/Chalk");

class AStage {
    #stageName = "DefaultStage";
    #padding = 50;
    #topFunctionName;
    #appName;
    #outputDir;
    #logFile;
    #startTimestamp = new Date();
    static #isLogFileInitialized = false;
    static #currentLog = "";
    static #maxLogSize = 2048;

    constructor(stageName, topFunctionName, outputDir = "output", appName = "default_app_name") {
        if (new.target === AStage) {
            throw new Error("Can't instantiate abstract class.");
        }
        this.#stageName = stageName;
        this.#topFunctionName = topFunctionName;
        this.#appName = appName;
        this.#outputDir = outputDir;
        this.#logFile = `${this.#outputDir}/log_${this.#appName}.txt`;

        if (!AStage.#isLogFileInitialized) {
            Io.writeFile(this.#logFile, "");
            AStage.#isLogFileInitialized = true;
        }
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

    writeMessage(message, forceFlush = false) {
        const strippedMsg = Chalk.stripColors(message) + "\n";
        AStage.#currentLog += strippedMsg;

        if (AStage.#currentLog.length > AStage.#maxLogSize || forceFlush) {
            Io.appendFile(this.#logFile, AStage.#currentLog);
            AStage.#currentLog = "";
        }

        println(message);
    }

    log(message) {
        const header = this.#getStageOutputHeader();
        this.writeMessage(`${header} ${message}`);
    }

    logStart() {
        const date = new Date();
        const timestamp = date.toISOString();
        const msg = `Starting at ${timestamp}`;

        this.log(msg);
        this.#startTimestamp = date;
    }

    logEnd() {
        const date = new Date();
        const diff = date.getTime() - this.#startTimestamp.getTime();
        const diffInSeconds = diff / 1000;
        const diff2Decimals = diffInSeconds.toFixed(2);

        const timestamp = date.toISOString();
        const msg = `Finished at ${timestamp} (elapsed time: ${diff2Decimals}s)`;

        this.log(msg);
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

        this.writeMessage(`${header} ${message} ${prettyPath}`);
    }

    logSuccess(message) {
        const header = this.#getStageOutputHeader();
        const success = Chalk.color("Success: ", "green");
        this.writeMessage(`${header} ${success} ${message}`);
    }

    logWarning(message) {
        const header = this.#getStageOutputHeader();
        const warning = Chalk.color("Warning: ", "yellow");
        this.writeMessage(`${header} ${warning} ${message}`);
    }

    logError(message) {
        const header = this.#getStageOutputHeader();
        const err = Chalk.color("Error: ", "red");
        this.writeMessage(`${header} ${err} ${message}`);
    }

    logTrace(exception) {
        const header = this.#getStageOutputHeader();
        const err = Chalk.color("Exception caught with stack trace:", "red");
        const end = Chalk.color("----------------------------------", "red");

        this.writeMessage(`${header} ${err}`);
        this.writeMessage(exception.stack);
        this.writeMessage(`${header} ${end}`);
    }

    logLine() {
        const header = this.#getStageOutputHeader();
        this.writeMessage(`${header}${"-".repeat(58)}`);
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