"use strict";

class UPTStage {
    #stageName = "DefaultStage";
    #padding = 40;

    constructor(stageName) {
        if (new.target === UPTStage) {
            throw new Error("Can't instantiate abstract class.");
        }

        this.#stageName = stageName;
    }

    log(message) {
        const prefix = "[UPT-" + this.#stageName + "]";
        const padding = this.#padding - prefix.length;
        println(prefix + "-".repeat(padding) + " " + message);
    }
}