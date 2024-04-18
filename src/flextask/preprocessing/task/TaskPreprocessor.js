"use strict";

laraImport("clava.code.Outliner");
laraImport("flextask/preprocessing/task/OutlineRegionFinder");
laraImport("flextask/preprocessing/task/ReplicaCreator");
laraImport("flextask/preprocessing/task/AppTimerInserter");
laraImport("flextask/AStage");

class TaskPreprocessor extends AStage {
    constructor(topFunction, outputDir, appName) {
        super("CTFlow-TaskPrep", topFunction, outputDir, appName);
    }

    preprocess() {
        this.outlineAll();
        this.createFunctionReplicas();
        this.insertTimer();
    }

    outlineAll() {
        this.log("Finding code regions for outlining...");
        const annotator = new OutlineRegionFinder(this.getTopFunctionName());

        const genericRegions = annotator.annotateGenericPass();
        const genCnt = this.#applyOutlining(genericRegions, "outlined_fun_");
        this.log(`Outlined ${genCnt} generic regions`);

        // annotator also does the outlining
        // probably need to change the generic annotator to do the same
        const loopCnt = annotator.annotateLoopPass();
        this.log(`Outlined ${loopCnt} loop regions`);

        this.log("Finished outlining regions");
    }

    #applyOutlining(regions, prefix) {
        const outliner = new Outliner();
        outliner.setVerbosity(false);
        outliner.setDefaultPrefix(prefix);

        let outCount = 0;
        for (const region of regions) {
            const start = region[0];
            const end = region[region.length - 1];

            outliner.outline(start, end);

            start.detach();
            end.detach();
            outCount++;
        }
        return outCount;
    }

    createFunctionReplicas() {
        this.log("Finding functions that can be replicated...");

        const replicaCreator = new ReplicaCreator(this.getTopFunctionName());
        const [nReplicas, nUnique] = replicaCreator.replicateAll();

        this.log(`Created ${nReplicas} replicas for ${nUnique} unique functions`);
    }

    insertTimer() {
        const timerInserter = new AppTimerInserter();
        const couldInsert = timerInserter.insertTimer(this.getTopFunctionJoinPoint());

        const topFunName = this.getTopFunctionName();
        if (!couldInsert) {
            this.log(`Could not insert timer around application starting point "${topFunName}"`);
        }
        else {
            this.log(`Inserted timer around application starting point "${topFunName}"`);
        }
    }
}