"use strict";

laraImport("lara.Platforms");
laraImport("UPTStage");
laraImport("CodeTransformationFlow");
laraImport("HolisticPartitioningFlow");

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