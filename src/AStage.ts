import { FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import Io from "@specs-feup/lara/api/lara/Io.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { ClavaUtils } from "./util/ClavaUtils.js";
import { EtgLogger } from "./EtgLogger.js";

export abstract class AStage {
    private topFunctionName: string;
    private appName: string;
    private outputDir: string;
    private stageName: string = "ETG";
    private logger: EtgLogger;
    private commonPrefix: string = "ETG";

    constructor(stageName: string, topFunctionName: string, outputDir = "output", appName = "default_app_name", commonPrefix = "ETG") {
        this.stageName = stageName;
        this.topFunctionName = topFunctionName;
        this.appName = appName;
        this.outputDir = outputDir;
        this.commonPrefix = commonPrefix;
        this.logger = new EtgLogger(this.stageName, this.outputDir, this.appName, commonPrefix);
    }

    public getTopFunctionJoinPoint(): FunctionJp {
        const funName = this.getTopFunctionName();
        const funs = Query.search(FunctionJp, (f) => f.name === funName && f.isImplementation).get();
        if (funs.length === 0) {
            throw new Error(`Top function '${funName}' not found.`);
        }
        return funs[0];
    }

    public getValidFunctions(): FunctionJp[] {
        const topFun = this.getTopFunctionJoinPoint();
        return ClavaUtils.getAllUniqueFunctions(topFun);
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
        this.logger.setLabelColor(color);
    }

    protected log(message: string): void {
        this.logger.log(message);
    }

    protected logStart(): void {
        this.logger.logStart();
    }

    protected logEnd(): void {
        this.logger.logEnd();
    }

    protected logOutput(message: string, path: string): void {
        this.logger.logOutput(message, path);
    }

    protected logSuccess(message: string): void {
        this.logger.logSuccess(message);
    }

    protected logWarning(message: string): void {
        this.logger.logWarning(message);
    }

    protected logError(message: string): void {
        this.logger.logError(message);
    }

    protected logTrace(exception: unknown): string {
        return this.logger.logTrace(exception);
    }

    protected logLine(len: number = 58): void {
        this.logger.logLine(len);
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
}