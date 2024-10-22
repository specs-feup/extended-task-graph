import { AStage } from "../AStage.js";
import { CodeTransformationFlow } from "./CodeTransformationFlow.js";
import { TaskGraph } from "../taskgraph/TaskGraph.js";
import { TaskGraphGenerationFlow } from "./TaskGraphGenerationFlow.js";
import Platforms from "@specs-feup/lara/api/lara/Platforms.js";

export class ExtendedTaskGraphAPI extends AStage {
    constructor(topFunctionName: string, outputDir: string = "output", appName: string = "default_app_name") {
        super("API", topFunctionName, `${outputDir}/${appName}`, appName);
    }

    public runCodeTransformationFlow(dumpCallGraph: boolean = true, dumpAST: boolean = true, doTransformations: boolean = true): boolean {
        this.logLine();
        this.ensureLinux();

        const flow = new CodeTransformationFlow(this.getTopFunctionName(), this.getOutputDir(), this.getAppName());
        const res = flow.run(dumpCallGraph, dumpAST, doTransformations);

        return res;
    }

    public runTaskGraphGenerationFlow(dumpGraph: boolean = true, gatherMetrics: boolean = true): TaskGraph | null {
        this.logLine();
        this.ensureLinux();

        const flow = new TaskGraphGenerationFlow(this.getTopFunctionName(), this.getOutputDir(), this.getAppName());
        const tg = flow.run(dumpGraph, gatherMetrics);

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

    private ensureLinux(): void {
        if (!Platforms.isLinux()) {
            const platName = Platforms.getPlatformName();
            this.log(`Current OS is "${platName}", but the ETG only outputs Linux-ready code!`);
            this.log("Setting Clava platform to Linux (i.e., any syscalls inserted will be for Linux)");
            Platforms.setLinux();
        }
        else {
            this.log("Current OS is Linux, ETG will output Linux-ready code");
        }
    }
}