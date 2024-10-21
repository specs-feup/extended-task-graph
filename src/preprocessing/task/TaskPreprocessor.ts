import { AStage } from "../../AStage.js";
import { AppTimerInserter } from "./AppTimerInserter.js";
import { ReplicaCreator } from "./ReplicaCreator.js";
import { Statement } from "@specs-feup/clava/api/Joinpoints.js";
import { OutlineRegionFinder } from "./OutlineRegionFinder.js";
import Outliner from "clava-code-transformations/Outliner";
import { DefaultPrefix } from "../../api/PreSuffixDefaults.js";

export class TaskPreprocessor extends AStage {
    constructor(topFunction: string, outputDir: string, appName: string) {
        super("TransFlow-TaskPrep", topFunction, outputDir, appName);
    }

    public preprocess() {
        this.createFunctionReplicas();
        this.outlineAll();
        this.insertTimer();
    }

    public outlineAll(): void {
        this.log("Finding code regions for outlining...");
        const annotator = new OutlineRegionFinder(this.getTopFunctionName());

        const genericRegions = annotator.annotateGenericPass();
        const genCnt = this.applyOutlining(genericRegions, DefaultPrefix.OUTLINED_FUN);
        this.log(`Outlined ${genCnt} generic regions`);

        // annotator also does the outlining
        // probably need to change the generic annotator to do the same
        const loopCnt = annotator.annotateLoopPass();
        this.log(`Outlined ${loopCnt} loop regions`);

        this.log("Finished outlining regions");
    }

    private applyOutlining(regions: Statement[][], prefix: string): number {
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

    public createFunctionReplicas() {
        this.log("Finding functions that can be replicated...");

        const replicaCreator = new ReplicaCreator(this.getTopFunctionName());
        const [nReplicas, nUnique] = replicaCreator.replicateAll();

        this.log(`Created ${nReplicas} replicas for ${nUnique} unique functions`);
    }

    public insertTimer() {
        const timerInserter = new AppTimerInserter();
        const couldInsert = timerInserter.insertTimer(this.getTopFunctionName());

        const topFunName = this.getTopFunctionName();
        if (!couldInsert) {
            this.log(`Could not insert timer around application starting point "${topFunName}"`);
        }
        else {
            this.log(`Inserted timer around application starting point "${topFunName}"`);
        }
    }
}