"use strict";

laraImport("InitialAnalysis");
laraImport("Preprocessor");
laraImport("UPTStage");
laraImport("UPTConfig");
laraImport("UPTUtils");

class UnnamedPartitioningTool extends UPTStage {

    constructor(config) {
        super("Main");
        UPTConfig.init(config);
    }

    run() {
        println("*".repeat(100));
        this.runStages();
        println("*".repeat(100));
    }

    runStages() {
        this.log("Running UnnamedPartitioningTool for application \"" + UPTConfig.get("appName") + "\"");

        this.applyInitialConfig();

        this.initialAnalysis();

        this.preprocessing();

        this.log("Done");
    }

    applyInitialConfig() {
        if (!UPTConfig.has("appName")) {
            UPTConfig.set("appName", "default_app_name");
        }
        if (UPTConfig.has("codeOutputDir")) {
            // update weaving folder
        }
        if (!UPTConfig.has("statsOutputDir")) {
            const weavingDir = Clava.getWeavingFolder().toString();
            const appName = UPTConfig.get("appName");
            const newDir = weavingDir + "/" + appName + "_output_stats";
            UPTConfig.set("statsOutputDir", newDir);
        }
        if (!UPTConfig.has("starterFunction")) {
            UPTConfig.set("starterFunction", "");
        }
    }

    initialAnalysis() {
        this.log("Running initial analysis step");
        const analyser = new InitialAnalysis(UPTConfig.get("statsOutputDir"), UPTConfig.get("appName"));
        analyser.analyse();
    }

    preprocessing() {
        this.log("Running preprocessing step");
        const prepropcessor = new Preprocessor(UPTConfig.get("starterFunction"));
        prepropcessor.preprocess();

        const res = UPTUtils.verifySyntax();
        this.log(res ? "Syntax verified" : "Syntax verification failed");
    }
}