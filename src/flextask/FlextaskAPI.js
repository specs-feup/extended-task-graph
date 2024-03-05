"use strict";

laraImport("lara.Platforms");
laraImport("flextask/AStage");
laraImport("flextask/CodeTransformationFlow");
laraImport("flextask/TaskGraphGenerationFlow");

class FlextaskAPI extends AStage {
    constructor(topFunctionName, outputDir = "output", appName = "default_app_name") {
        super("FlextaskAPI", topFunctionName, outputDir, appName);

        if (!Platforms.isLinux()) {
            const platName = Platforms.getPlatformName();
            this.log(`Current OS is "${platName}", but Flextask only outputs Linux-ready code!`);
            this.log("Setting Clava platform to Linux (i.e., any syscalls inserted will be for Linux)");
            Platforms.setLinux();
        }
    }

    runBothFlows() {
        const success = this.runCodeTransformationFlow();
        if (!success) {
            this.log("Code transformation flow failed, aborting task graph generation flow");
            this.#printLine();
        }
        else {
            this.runTaskGraphGenerationFlow(false);
        }
    }

    runCodeTransformationFlow() {
        this.#printLine();

        const flow = new CodeTransformationFlow(this.getTopFunctionName(), this.getOutputDir(), this.getAppName());
        const res = flow.run();

        this.#printLine();
        return res;
    }

    runTaskGraphGenerationFlow(printFirstLine = true) {
        if (printFirstLine) {
            this.#printLine();
        }

        const flow = new TaskGraphGenerationFlow(this.getTopFunctionName(), this.getOutputDir(), this.getAppName());
        const tg = flow.run();

        this.#printLine();
        return tg;
    }

    #printLine() {
        println("*".repeat(100));
    }
}