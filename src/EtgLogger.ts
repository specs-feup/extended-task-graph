import chalk from "chalk";
import { existsSync, mkdirSync, writeSync } from "node:fs";
import { createLogger, format, Logger, transports } from "winston";

export class EtgLogger {
    private stageName: string = "DefaultStage";
    private commonPrefix: string = "ETG";
    private padding: number = 50;
    private outputDir: string = "output";
    private startTimestamp: Date = new Date();
    private appName: string = "default_app_name";
    private labelColor: (...text: unknown[]) => string = chalk.cyan;
    private static isLoggerInit: boolean = false;
    private static logger: Logger;

    constructor(stageName: string, outputDir: string, appName: string, commonPrefix: string) {
        this.stageName = stageName;
        this.outputDir = outputDir;
        this.appName = appName;
        this.commonPrefix = commonPrefix;

        if (!EtgLogger.isLoggerInit) {
            this.initLogger();
        }
    }

    public setLabelColor(color: (...text: unknown[]) => string): void {
        this.labelColor = color;
    }

    public log(message: string): void {
        const header = this.getStageOutputHeader();
        this.writeMessage(`${header} ${message}`);
    }

    public logStart(): void {
        const date = new Date();
        const timestamp = date.toISOString();
        const msg = `Starting ${this.stageName} at ${timestamp}`;

        this.log(msg);
        this.startTimestamp = date;
    }

    public logEnd(): void {
        const date = new Date();
        const diff = date.getTime() - this.startTimestamp.getTime();
        const diffInSeconds = diff / 1000;
        const diff2Decimals = diffInSeconds.toFixed(2);

        const timestamp = date.toISOString();
        const msg = `Finished ${this.stageName} at ${timestamp} (elapsed time: ${diff2Decimals}s)`;

        this.log(msg);
    }

    public logOutput(message: string, path: string): void {
        const header = this.getStageOutputHeader();

        const minPath = path.substring(path.indexOf(this.appName));

        const prettyPath = chalk.blue.italic(minPath);
        this.writeMessage(`${header} ${message} ${prettyPath}`);
    }

    public logSuccess(message: string): void {
        const header = this.getStageOutputHeader();
        const success = chalk.green("Success:");
        this.writeMessage(`${header} ${success} ${message}`);
    }

    public logWarning(message: string): void {
        const header = this.getStageOutputHeader();
        const warning = chalk.yellow("Warning:");
        this.writeMessage(`${header} ${warning} ${message}`);
    }

    public logError(message: string): void {
        const header = this.getStageOutputHeader();
        const err = chalk.red("Error:");
        this.writeMessage(`${header} ${err} ${message}`);
    }

    public logTrace(exception: unknown): string {
        const header = this.getStageOutputHeader();
        const err = chalk.red("Exception caught with stack trace:");
        const end = chalk.red("----------------------------------");

        this.writeMessage(`${header} ${err}`);

        const trace = (exception instanceof Error) ? exception.stack as string : "(No stack trace available)";
        this.writeMessage(trace);
        this.writeMessage(`${header} ${end}`);

        return trace;
    }

    public logLine(len: number = 58): void {
        const header = this.getStageOutputHeader();
        this.writeMessage(`${header}${"-".repeat(len)}`);
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

        const stdTransporter = new transports.Console({
            format: format.printf(({ message }) => {
                return `${message}`;
            }),
            level: 'info',
            handleExceptions: true,

        });
        const fileTransporter = new transports.File({
            filename: logFile,
            options: { highWaterMark: 1024 * 1024 }, // 1 MB buffer
            format: format.combine(
                format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                format.printf(({ timestamp, message }) => {
                    // eslint-disable-next-line no-control-regex
                    const stripped = (message as string).replace(/\u001b\[[0-9;]*m/g, '').replace("[ETG", "\n[ETG");
                    return `[${timestamp}] ${stripped}`;
                })
            ),
            level: 'info'
        })

        EtgLogger.logger = createLogger({
            level: 'info',
            transports: [
                stdTransporter,
                fileTransporter
            ]
        });
        EtgLogger.isLoggerInit = true;

        if (process.stdout.isTTY && process.stdout.write.length === 2) {
            writeSync(1, '');
        }
    }

    private writeMessage(message: string): void {
        EtgLogger.logger.info(message);
    }
}