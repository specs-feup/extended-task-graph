"use strict";

class GlobalDataFinder {
    #taskGraph;

    constructor(taskGraph) {
        this.#taskGraph = taskGraph;
    }

    calculateGlobalData() {
        const globalData = {};
        const globalTask = this.#taskGraph.getGlobalTask();

        for (const datum of globalTask.getData()) {
            const outgoing = globalTask.getOutgoingOfData(datum);

            if (outgoing.length > 0) {
                const datumProps = {
                    "origin": datum.getOriginType(),
                    "sizeInBytes": datum.getSizeInBytes(),
                    "cxxType": datum.getDatatype(),
                    "isScalar": datum.isScalar(),
                    "alternateName": datum.getAlternateName(),
                    "stateChanges": {
                        "isInit": datum.isInitialized(),
                        "isWritten": datum.isWritten(),
                        "isRead": datum.isRead()
                    }
                }
                globalData[datum.getName()] = datumProps;
            }
        }
        return globalData;
    }

}