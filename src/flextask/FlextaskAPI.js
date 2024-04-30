"use strict";

laraImport("lara.Platforms");
laraImport("flextask/AStage");
laraImport("flextask/CodeTransformationFlow");
laraImport("flextask/TaskGraphGenerationFlow");

class FlextaskAPI extends AStage {
    constructor(topFunctionName, outputDir = "output", appName = "default_app_name") {
        super("FlextaskAPI", topFunctionName, outputDir, appName);
    }

    runCodeTransformationFlow(dumpCallGraph = true, dumpAST = true, doTransformations = true) {
        this.#printLine();
        this.#ensureLinux();

        const flow = new CodeTransformationFlow(this.getTopFunctionName(), this.getOutputDir(), this.getAppName());
        const res = flow.run(dumpCallGraph, dumpAST, doTransformations);

        return res;
    }

    runTaskGraphGenerationFlow(dumpGraph = true, gatherMetrics = true) {
        this.#printLine();
        this.#ensureLinux();

        const flow = new TaskGraphGenerationFlow(this.getTopFunctionName(), this.getOutputDir(), this.getAppName());
        const tg = flow.run(dumpGraph, gatherMetrics);

        this.#printLine();
        return tg;
    }

    #ensureLinux() {
        if (!Platforms.isLinux()) {
            const platName = Platforms.getPlatformName();
            this.log(`Current OS is "${platName}", but Flextask only outputs Linux-ready code!`);
            this.log("Setting Clava platform to Linux (i.e., any syscalls inserted will be for Linux)");
            Platforms.setLinux();
        }
    }

    #printLine() {
        const lineOfStars = "*".repeat(100);
        this.writeMessage(lineOfStars, true);
    }
}