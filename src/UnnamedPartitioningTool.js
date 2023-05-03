"use strict";

laraImport("InitialAnalysis")
laraImport("Preprocessor");

class UnnamedPartitioningTool {
    #config;

    constructor(config) {
        this.#config = config;
    }

    run() {
        this.log("Running UnnamedPartitioningTool");

        this.applyInitialConfig();

        this.initialAnalysis();

        //this.preprocessing();

        this.log("Done");
    }

    applyInitialConfig() {
        if (!this.#config.hasOwnProperty("appName")) {
            config.appName = "default_app_name";
        }
        if (this.#config.hasOwnProperty("codeOutputDir")) {
            // update weaving folder
        }
        if (!this.#config.hasOwnProperty("statsOutputDir")) {
            var weavingDir = Clava.getWeavingFolder().toString();
            /*
            weavingDir = Strings.replacer(weavingDir.toString(), /\\/g, '/');
            weavingDir = Strings.escapeJson(weavingDir);
            println(weavingDir);

            const idx = weavingDir.lastIndexOf("/");
            this.#config.statsOutputDir = weavingDir.substring(0, idx + 1) + "output_stats";
            */
            this.#config.statsOutputDir = weavingDir + "/" + this.#config.appName + "_output_stats";
        }
    }

    initialAnalysis() {
        this.log("Running initial analysis step");
        const analyser = new InitialAnalysis(this.#config.statsOutputDir, this.#config.appName);
        analyser.analyse();
    }

    preprocessing() {
        this.log("Running preprocessing step");
        const prepropcessor = new Preprocessor();
        prepropcessor.preprocess();
    }

    log(msg) {
        println("[UPT] " + msg);
    }
}