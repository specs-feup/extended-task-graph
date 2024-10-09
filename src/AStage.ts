import { FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import Io from "@specs-feup/lara/api/lara/Io.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Chalk, ChalkColor, ChalkStyle } from "./util/Chalk.js";
import { OutputDirectories } from "./api/OutputDirectories.js";


export abstract class AStage {
    #stageName: string = "DefaultStage";
    #commonPrefix: string = "ETG"
    #padding: number = 50;
    #topFunctionName: string;
    #appName: string;
    #outputDir: string;
    #logFile: string;
    #startTimestamp: Date = new Date();
    static #isLogFileInitialized: boolean = false;
    static #currentLog: string = "";
    static #maxLogSize: number = 2048;

    constructor(stageName: string, topFunctionName: string, outputDir = "output", appName = "default_app_name") {
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

    getTopFunction(): FunctionJp {
        console.log("!!!!!! getTopFunction() is deprecated, use getTopFunctionJoinPoint() instead !!!!!!");
        return this.getTopFunctionJoinPoint();
    }

    getTopFunctionJoinPoint(): FunctionJp {
        return Query.search(FunctionJp, { name: this.getTopFunctionName(), isImplementation: true }).first() as FunctionJp;
    }

    setAppName(appName: string): void {
        this.#appName = appName;
    }

    setOutputDir(outputDir: string): void {
        this.#outputDir = outputDir;
    }

    getAppName(): string {
        return this.#appName;
    }

    getOutputDir(): string {
        return this.#outputDir;
    }

    getTopFunctionName(): string {
        return this.#topFunctionName;
    }

    log(message: string): void {
        const header = this.#getStageOutputHeader();
        this.#writeMessage(`${header} ${message}`);
    }

    logStart(): void {
        const date = new Date();
        const timestamp = date.toISOString();
        const msg = `Starting at ${timestamp}`;

        this.log(msg);
        this.#startTimestamp = date;
    }

    logEnd(): void {
        const date = new Date();
        const diff = date.getTime() - this.#startTimestamp.getTime();
        const diffInSeconds = diff / 1000;
        const diff2Decimals = diffInSeconds.toFixed(2);

        const timestamp = date.toISOString();
        const msg = `Finished at ${timestamp} (elapsed time: ${diff2Decimals}s)`;

        this.log(msg);
    }

    logOutput(message: string, path: string): void {
        const header = this.#getStageOutputHeader();

        let minPath = path;
        const subpaths = Object.values(OutputDirectories);
        for (const subpath of subpaths) {
            if (path.includes(subpath)) {
                minPath = path.substring(path.indexOf(subpath));
                break;
            }
        }

        let prettyPath = Chalk.style(minPath, ChalkStyle.italic);
        prettyPath = Chalk.color(prettyPath, ChalkColor.blue);

        this.#writeMessage(`${header} ${message} ${prettyPath}`);
    }

    logSuccess(message: string): void {
        const header = this.#getStageOutputHeader();
        const success = Chalk.color("Success: ", ChalkColor.green);
        this.#writeMessage(`${header} ${success} ${message}`);
    }

    logWarning(message: string): void {
        const header = this.#getStageOutputHeader();
        const warning = Chalk.color("Warning: ", ChalkColor.yellow);
        this.#writeMessage(`${header} ${warning} ${message}`);
    }

    logError(message: string): void {
        const header = this.#getStageOutputHeader();
        const err = Chalk.color("Error: ", ChalkColor.red);
        this.#writeMessage(`${header} ${err} ${message}`);
    }

    logTrace(exception: unknown): void {
        const header = this.#getStageOutputHeader();
        const err = Chalk.color("Exception caught with stack trace:", ChalkColor.red);
        const end = Chalk.color("----------------------------------", ChalkColor.red);

        this.#writeMessage(`${header} ${err}`);
        if (exception instanceof Error) {
            this.#writeMessage(exception.stack as string);
        }
        else {
            this.#writeMessage("(No stack trace available)");
        }
        this.#writeMessage(`${header} ${end}`);
    }

    logLine(len: number = 58): void {
        const header = this.#getStageOutputHeader();
        this.#writeMessage(`${header}${"-".repeat(len)}`);
    }

    saveToFile(content: string, filename: string): string {
        const fullName = `${this.#outputDir}/${this.#appName}_${filename}`;
        Io.writeFile(fullName, content);
        return fullName;
    }

    saveToFileInSubfolder(content: string, filename: string, subfolder: string): string {
        const fullName = `${this.#outputDir}/${subfolder}/${this.#appName}_${filename}`;
        Io.writeFile(fullName, content);
        return fullName;
    }

    #getStageOutputHeader(): string {
        const fullName = `${this.#commonPrefix}-${this.#stageName}`;
        const coloredName = Chalk.color(fullName, ChalkColor.cyan);

        const header = `[${coloredName}] `.padEnd(this.#padding, '-');
        return header;
    }

    #writeMessage(message: string, forceFlush = false): void {
        const strippedMsg = Chalk.stripColors(message) + "\n";
        AStage.#currentLog += strippedMsg;

        if (AStage.#currentLog.length > AStage.#maxLogSize || forceFlush) {
            Io.appendFile(this.#logFile, AStage.#currentLog);
            AStage.#currentLog = "";
        }

        console.log(message);
    }
}