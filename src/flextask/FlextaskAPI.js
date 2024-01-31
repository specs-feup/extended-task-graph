"use strict";

laraImport("lara.Platforms");
laraImport("flextask/AStage");
laraImport("flextask/CodeTransformationFlow");
laraImport("flextask/TaskGraphGenerationFlow");

class FlextaskAPI extends AStage {
    #config;

    constructor(config) {
        super("FlextaskAPI");

        if (!Platforms.isLinux()) {
            const platName = Platforms.getPlatformName();
            this.log(`Current OS is "${platName}", but Flextask only outputs Linux-ready code!`);
            this.log("Setting Clava platform to Linux (i.e., any syscalls inserted will be for Linux)");
            Platforms.setLinux();
        }

        if (!config["appName"]) {
            throw new Error("Missing appName in config");
        }
        if (!config["outputDir"]) {
            throw new Error("Missing outputDir in config");
        }

        this.#config = config;
        this.setAppName(this.#config["appName"]);
        this.setOutputDir(this.#config["outputDir"]);
    }

    runBothFlows() {
        this.runCodeTransformationFlow();
        this.runTaskGraphGenerationFlow(false);
    }

    runCodeTransformationFlow() {
        this.#printLine();

        const flow = new CodeTransformationFlow(this.#config);
        flow.run();

        this.#printLine();
    }

    runTaskGraphGenerationFlow(printFirstLine = true) {
        if (printFirstLine) {
            this.#printLine();
        }

        const flow = new TaskGraphGenerationFlow(this.#config);
        flow.run();

        this.#printLine();
    }

    #printLine() {
        println("*".repeat(100));
    }
}