import { AStage } from "../AStage.js";
import { CodeTransformationFlow } from "./CodeTransformationFlow.js";
import { TaskGraph } from "../taskgraph/TaskGraph.js";
import { TaskGraphGenerationFlow } from "./TaskGraphGenerationFlow.js";
import Platforms from "@specs-feup/lara/api/lara/Platforms.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { TransFlowConfig } from "./TransFlowConfig.js";
import { GenFlowConfig } from "./GenFlowConfig.js";

export class ExtendedTaskGraphAPI extends AStage {
    constructor(topFunctionName: string = "main", outputDir: string = "output", appName: string = "default_app_name") {
        super("API", topFunctionName, `${outputDir}/${appName}`, appName);
    }

    public runCodeTransformationFlow(config: TransFlowConfig = new TransFlowConfig()): boolean {
        this.logLine();
        const ok = this.setupEnvironment();
        if (!ok) {
            return false;
        }

        const flow = new CodeTransformationFlow(this.getTopFunctionName(), this.getOutputDir(), this.getAppName());
        const res = flow.runAll(config);

        return res;
    }

    public runTaskGraphGenerationFlow(config: GenFlowConfig = new GenFlowConfig()): TaskGraph | null {
        this.logLine();
        const ok = this.setupEnvironment();
        if (!ok) {
            return null;
        }
        if (!config.enabled) {
            this.log("Flow was deliberately disabled, skipping...");
            return null;
        }

        const flow = new TaskGraphGenerationFlow(this.getTopFunctionName(), this.getOutputDir(), this.getAppName());
        const tg = flow.runAll(config);

        this.logLine();
        return tg;
    }

    public generateSourceCode(subfolder: string): void {
        const flow = new CodeTransformationFlow(this.getTopFunctionName(), this.getOutputDir(), this.getAppName());
        flow.generateCode(subfolder);
    }

    public generateTaskGraph(subfolder?: string): TaskGraph | null {
        const flow = new TaskGraphGenerationFlow(this.getTopFunctionName(), this.getOutputDir(), this.getAppName());

        if (subfolder == undefined) {
            return flow.buildTaskGraph();
        }
        else {
            return flow.buildTaskGraph(subfolder);
        }
    }

    public dumpTaskGraph(etg: TaskGraph, subfolder?: string): void {
        const flow = new TaskGraphGenerationFlow(this.getTopFunctionName(), this.getOutputDir(), this.getAppName());

        if (subfolder == undefined) {
            flow.dumpTaskGraph(etg);
        }
        else {
            flow.dumpTaskGraph(etg, subfolder);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public gatherTaskGraphMetrics(etg: TaskGraph, subfolder?: string): Record<string, any> {
        const flow = new TaskGraphGenerationFlow(this.getTopFunctionName(), this.getOutputDir(), this.getAppName());

        if (subfolder == undefined) {
            return flow.analyzeTaskGraph(etg);
        }
        else {
            return flow.analyzeTaskGraph(etg, subfolder);
        }
    }

    private setupEnvironment(): boolean {
        if (Clava.getProgram() == null || Clava.getProgram().files.length === 0) {
            this.logError("No input files were provided! Aborting...");
            return false;
        }
        if (Clava.getStackSize() === 0) {
            this.logError("There is no loaded AST! Aborting...");
            return false;
        }
        this.log(`Current app is ${this.getAppName()}, with top function "${this.getTopFunctionName()}"`);

        if (!Platforms.isLinux()) {
            const platName = Platforms.getPlatformName();
            this.log(`Current OS is "${platName}", but the ETG only outputs Linux-ready code!`);
            this.log("Setting Clava platform to Linux (i.e., any syscalls inserted will be for Linux)");
            Platforms.setLinux();
        }
        else {
            this.log("Current OS is Linux, ETG will output Linux-ready code");
        }
        return true;
    }
}