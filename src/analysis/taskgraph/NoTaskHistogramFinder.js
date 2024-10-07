"use strict";

class NoTaskHistogramFinder {
    #taskGraph;

    constructor(taskGraph) {
        this.#taskGraph = taskGraph;
    }

    calculateNoTaskHistogram() {
        const hist = {};

        for (const inlinable of this.#taskGraph.getInlinables()) {
            const inlinableName = inlinable.name;

            if (inlinableName in hist) {
                hist[inlinableName]++;
            }
            else {
                hist[inlinableName] = 1;
            }
        }
        return hist;
    }
}