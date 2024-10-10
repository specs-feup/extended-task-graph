import { AStage } from "../AStage.js";
import { CodeTransformationFlow } from "./CodeTransformationFlow.js";
import { TaskGraph } from "../taskgraph/TaskGraph.js";
import { TaskGraphGenerationFlow } from "./TaskGraphGenerationFlow.js";
import Platforms from "@specs-feup/lara/api/lara/Platforms.js";

export class ExtendedTaskGraphAPI extends AStage {
    constructor(topFunctionName: string, outputDir: string = "output", appName: string = "default_app_name") {
        super("API", topFunctionName, `${outputDir}/${appName}`, appName);
    }

    runCodeTransformationFlow(dumpCallGraph: boolean = true, dumpAST: boolean = true, doTransformations: boolean = true): boolean {
        this.logLine();
        this.#ensureLinux();

        const flow = new CodeTransformationFlow(this.getTopFunctionName(), this.getOutputDir(), this.getAppName());
        const res = flow.run(dumpCallGraph, dumpAST, doTransformations);

        return res;
    }

    runTaskGraphGenerationFlow(dumpGraph: boolean = true, gatherMetrics: boolean = true): TaskGraph | null {
        this.logLine();
        this.#ensureLinux();

        const flow = new TaskGraphGenerationFlow(this.getTopFunctionName(), this.getOutputDir(), this.getAppName());
        const tg = flow.run(dumpGraph, gatherMetrics);

        this.logLine();
        return tg;
    }

    #ensureLinux(): void {
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