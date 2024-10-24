import { AStage } from "../../AStage.js";
import { AppTimerInserter } from "./AppTimerInserter.js";
import { ReplicaCreator } from "./ReplicaCreator.js";
import { OutlineRegionFinder } from "./OutlineRegionFinder.js";

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
        const finder = new OutlineRegionFinder(this.getTopFunctionName());

        const genCnt = finder.outlineGenericRegions();
        this.log(`Outlined ${genCnt} generic regions`);

        const loopCnt = finder.outlineLoops();
        this.log(`Outlined ${loopCnt} loop regions`);

        this.log("Finished outlining regions");
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