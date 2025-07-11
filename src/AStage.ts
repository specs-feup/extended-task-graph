import { FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import Io from "@specs-feup/lara/api/lara/Io.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import chalk from "chalk";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { createLogger, format, Logger, transports } from "winston";
import { ClavaUtils } from "./util/ClavaUtils.js";

export abstract class AStage {
    private stageName: string = "DefaultStage";
    private commonPrefix: string = "ETG";
    private padding: number = 50;
    private topFunctionName: string;
    private appName: string;
    private outputDir: string;
    private startTimestamp: Date = new Date();
    private labelColor: (...text: unknown[]) => string = chalk.cyan;

    private static isLoggerInit: boolean = false;
    private static logger: Logger;

    constructor(stageName: string, topFunctionName: string, outputDir = "output", appName = "default_app_name", commonPrefix = "ETG") {
        this.stageName = stageName;
        this.topFunctionName = topFunctionName;
        this.appName = appName;
        this.outputDir = outputDir;
        this.commonPrefix = commonPrefix;

        if (!AStage.isLoggerInit) {
            this.initLogger();
        }
    }

    public getTopFunctionJoinPoint(): FunctionJp {
        return Query.search(FunctionJp, { name: this.getTopFunctionName(), isImplementation: true }).first() as FunctionJp;
    }

    public getValidFunctions(): FunctionJp[] {
        return ClavaUtils.getAllUniqueFunctions(this.getTopFunctionJoinPoint());
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

    public getCommonPrefix(): string {
        return this.commonPrefix;
    }

    public generateCode(subfolder: string): string {
        return ClavaUtils.generateCode(this.getOutputDir(), subfolder);
    }

    public generateFile(filepath: string, content: string): string {
        const fullPath = `${this.getOutputDir()}/${filepath}`;
        Io.writeFile(fullPath, content);
        return fullPath;
    }

    public deleteFolderContents(folder: string): void {
        const path = `${this.getOutputDir()}/${folder}`;
        Io.deleteFolderContents(path);
    }

    public setLabelColor(color: (...text: unknown[]) => string): void {
        this.labelColor = color;
    }

    protected log(message: string): void {
        const header = this.getStageOutputHeader();
        this.writeMessage(`${header} ${message}`);
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

        this.log(msg);
    }

    protected logOutput(message: string, path: string): void {
        const header = this.getStageOutputHeader();

        const minPath = path.substring(path.indexOf(this.appName));

        const prettyPath = chalk.blue.italic(minPath);
        this.writeMessage(`${header} ${message} ${prettyPath}`);
    }

    protected logSuccess(message: string): void {
        const header = this.getStageOutputHeader();
        const success = chalk.green("Success:");
        this.writeMessage(`${header} ${success} ${message}`);
    }

    protected logWarning(message: string): void {
        const header = this.getStageOutputHeader();
        const warning = chalk.yellow("Warning:");
        this.writeMessage(`${header} ${warning} ${message}`);
    }

    protected logError(message: string): void {
        const header = this.getStageOutputHeader();
        const err = chalk.red("Error:");
        this.writeMessage(`${header} ${err} ${message}`);
    }

    protected logTrace(exception: unknown): string {
        const header = this.getStageOutputHeader();
        const err = chalk.red("Exception caught with stack trace:");
        const end = chalk.red("----------------------------------");

        this.writeMessage(`${header} ${err}`);

        const trace = (exception instanceof Error) ? exception.stack as string : "(No stack trace available)";
        this.writeMessage(trace);
        this.writeMessage(`${header} ${end}`);

        return trace;
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
        const coloredName = this.labelColor(fullName);

        const header = `[${coloredName}] `.padEnd(this.padding, '-');
        return header;
    }

    private initLogger(): void {
        const logFile = `${this.outputDir}/${this.appName}.log`;
        if (!existsSync(this.outputDir)) {
            mkdirSync(this.outputDir, { recursive: true });
        }
        writeFileSync(logFile, '');

        const stdTransporter = new transports.Console({
            format: format.printf(({ message }) => {
                return `${message}`;
            })
        });
        const fileTransporter = new transports.File({
            filename: logFile,
            format: format.combine(
                format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                format.printf(({ timestamp, message }) => {
                    // eslint-disable-next-line no-control-regex
                    const stripped = (message as string).replace(/\u001b\[[0-9;]*m/g, '').replace("[ETG", "\n[ETG");
                    return `[${timestamp}] ${stripped}`;
                })
            )
        })

        AStage.logger = createLogger({
            level: 'info',
            transports: [
                stdTransporter,
                fileTransporter
            ]
        });
        AStage.isLoggerInit = true;
    }

    private writeMessage(message: string): void {
        AStage.logger.info(message);
    }
}