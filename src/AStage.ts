import { FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import Io from "@specs-feup/lara/api/lara/Io.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { OutputDirectories } from "./api/OutputDirectories.js";
import chalk from "chalk";

export abstract class AStage {
    private stageName: string = "DefaultStage";
    private commonPrefix: string = "ETG"
    private padding: number = 50;
    private topFunctionName: string;
    private appName: string;
    private outputDir: string;
    private startTimestamp: Date = new Date();

    private static isLogFileInitialized: boolean = false;
    private static logFile: string = "";
    private static currentLog: string = "";
    private static maxLogSize: number = 248;

    constructor(stageName: string, topFunctionName: string, outputDir = "output", appName = "default_app_name") {
        this.stageName = stageName;
        this.topFunctionName = topFunctionName;
        this.appName = appName;
        this.outputDir = outputDir;

        if (!AStage.isLogFileInitialized) {
            AStage.logFile = `${this.outputDir}/log_${this.appName}.txt`;
            Io.writeFile(AStage.logFile, "");
            AStage.isLogFileInitialized = true;
        }
    }

    public getTopFunction(): FunctionJp {
        console.log("!!!!!! getTopFunction() is deprecated, use getTopFunctionJoinPoint() instead !!!!!!");
        return this.getTopFunctionJoinPoint();
    }

    public getTopFunctionJoinPoint(): FunctionJp {
        return Query.search(FunctionJp, { name: this.getTopFunctionName(), isImplementation: true }).first() as FunctionJp;
    }

    public setAppName(appName: string): void {
        this.appName = appName;
    }

    public setOutputDir(outputDir: string): void {
        this.outputDir = outputDir;
    }

    public getAppName(): string {
        return this.appName;
    }

    public getOutputDir(): string {
        return this.outputDir;
    }

    public getTopFunctionName(): string {
        return this.topFunctionName;
    }

    protected log(message: string, forceFlush: boolean = false): void {
        const header = this.getStageOutputHeader();
        this.writeMessage(`${header} ${message}`, forceFlush);
    }

    protected logStart(): void {
        const date = new Date();
        const timestamp = date.toISOString();
        const stage = "ETG-" + this.stageName;
        const msg = `Starting ${stage} at ${timestamp}`;

        this.log(msg);
        this.startTimestamp = date;
    }

    protected logEnd(): void {
        const date = new Date();
        const diff = date.getTime() - this.startTimestamp.getTime();
        const diffInSeconds = diff / 1000;
        const diff2Decimals = diffInSeconds.toFixed(2);

        const stage = "ETG-" + this.stageName;
        const timestamp = date.toISOString();
        const msg = `Finished ${stage} at ${timestamp} (elapsed time: ${diff2Decimals}s)`;

        this.log(msg, true);
    }

    protected logOutput(message: string, path: string): void {
        const header = this.getStageOutputHeader();

        let minPath = path;
        const subpaths = Object.values(OutputDirectories);
        for (const subpath of subpaths) {
            if (path.includes(subpath)) {
                minPath = path.substring(path.indexOf(subpath));
                break;
            }
        }

        const prettyPath = chalk.blue.italic(minPath);
        this.writeMessage(`${header} ${message} ${prettyPath}`);
    }

    protected logSuccess(message: string): void {
        const header = this.getStageOutputHeader();
        const success = chalk.green("Success: ");
        this.writeMessage(`${header} ${success} ${message}`);
    }

    protected logWarning(message: string): void {
        const header = this.getStageOutputHeader();
        const warning = chalk.yellow("Warning: ");
        this.writeMessage(`${header} ${warning} ${message}`);
    }

    protected logError(message: string): void {
        const header = this.getStageOutputHeader();
        const err = chalk.red("Error: ");
        this.writeMessage(`${header} ${err} ${message}`);
    }

    protected logTrace(exception: unknown): void {
        const header = this.getStageOutputHeader();
        const err = chalk.red("Exception caught with stack trace:");
        const end = chalk.red("----------------------------------");

        this.writeMessage(`${header} ${err}`);
        if (exception instanceof Error) {
            this.writeMessage(exception.stack as string);
        }
        else {
            this.writeMessage("(No stack trace available)");
        }
        this.writeMessage(`${header} ${end}`);
    }

    protected logLine(len: number = 58): void {
        const header = this.getStageOutputHeader();
        this.writeMessage(`${header}${"-".repeat(len)}`);
    }

    protected saveToFile(content: string, filename: string): string {
        const fullName = `${this.outputDir}/${this.appName}_${filename}`;
        Io.writeFile(fullName, content);
        return fullName;
    }

    protected saveToFileInSubfolder(content: string, filename: string, subfolder: string): string {
        const fullName = `${this.outputDir}/${subfolder}/${this.appName}_${filename}`;
        Io.writeFile(fullName, content);
        return fullName;
    }

    private getStageOutputHeader(): string {
        const fullName = `${this.commonPrefix}-${this.stageName}`;
        const coloredName = chalk.cyan(fullName);

        const header = `[${coloredName}] `.padEnd(this.padding, '-');
        return header;
    }

    private writeMessage(message: string, forceFlush = false): void {
        console.log(message);

        // eslint-disable-next-line no-control-regex
        const strippedMsg = message.replace(/\u001b\[[0-9;]*m/g, '').replace("[ETG", "\n[ETG");
        AStage.currentLog += strippedMsg;

        if (AStage.currentLog.length > AStage.maxLogSize || forceFlush) {
            Io.appendFile(AStage.logFile, AStage.currentLog);
            AStage.currentLog = "";
        }
    }
}