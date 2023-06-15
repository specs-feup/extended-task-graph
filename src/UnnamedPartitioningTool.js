"use strict";

laraImport("UPTStage");
laraImport("CodeTransformationFlow");
laraImport("HolisticPartitioningFlow");
laraImport("analysis/ApplicationAnalyser");
laraImport("preprocessing/Preprocessor");
laraImport("util/ClavaUtils");

class UnnamedPartitioningTool extends UPTStage {
    #config;

    constructor(config) {
        super("Main");
        this.#config = config;
        this.#applyInitialConfig();
        this.setAppName(this.#config["appName"]);
        this.setOutputDir(this.#config["outputDir"]);
    }

    runBothFlows() {
        this.#printLine();
        this.log("Running UnnamedPartitioningTool for application \"" + this.getAppName() + "\" using both flows");
        this.runCodeTransformationFlow();
        this.runHolisticFlow(false);
    }

    runCodeTransformationFlow() {
        this.#printLine();

        const flow = new CodeTransformationFlow(this.#config);
        flow.run();

        this.#printLine();
    }

    runHolisticFlow(printFirstLine = true) {
        if (printFirstLine) {
            this.#printLine();
        }

        const flow = new HolisticPartitioningFlow(this.#config);
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