"use strict";

laraImport("lara.Platforms");
laraImport("flextask/UPTStage");
laraImport("flextask/CodeTransformationFlow");
laraImport("flextask/TaskGraphGenerationFlow");

class UnnamedPartitioningTool extends UPTStage {
    #config;

    constructor(config) {
        super("Main");
        this.#config = config;
        this.#applyInitialConfig();
        this.setAppName(this.#config["appName"]);
        this.setOutputDir(this.#config["outputDir"]);

        Platforms.setLinux();
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

    #applyInitialConfig() {
        if (!this.#config.hasOwnProperty("appName")) {
            UPTConfig.set("appName", "default_app_name");
        }
        if (!this.#config.hasOwnProperty("starterFunction")) {
            UPTConfig.set("starterFunction", "main");
        }
    }

    #printLine() {
        println("*".repeat(100));
    }
}