"use strict";

laraImport("UPTStage");
laraImport("util.ClavaUtils");

class HolisticPartitioningFlow extends UPTStage {
    #config;

    constructor(config) {
        super("HPFlow", config["outputDir"], config["appName"]);
        this.#config = config;
    }

    run() {
        this.log("Running holistic HW/SW partitioning flow");

        // TODO

        this.log("Holistic HW/SW partitioning flow finished successfully!");
    }


}