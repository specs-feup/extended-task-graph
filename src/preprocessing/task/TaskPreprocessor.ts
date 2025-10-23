import { AStage } from "../../AStage.js";
import { AppTimerInserter } from "./AppTimerInserter.js";
import { ReplicaCreator } from "./ReplicaCreator.js";
import { OutlineRegionFinder } from "./OutlineRegionFinder.js";
import { DefaultPrefix } from "../../api/PreSuffixDefaults.js";
import { Voidifier } from "@specs-feup/clava-code-transforms/Voidifier";
import { SourceCodeOutput } from "../../api/OutputDirectories.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";

export class TaskPreprocessor extends AStage {
    constructor(topFunction: string, outputDir: string, appName: string) {
        super("TransFlow-TaskPrep", topFunction, outputDir, appName);
    }

    public preprocess() {
        this.outlineAll();
        Clava.rebuild();

        this.ensureVoidReturns();
        Clava.rebuild();

        this.createFunctionReplicas();
        Clava.rebuild();
    }

    public generateIntermediateCode(subfolder: string, message: string): void {
        const dir = `${SourceCodeOutput.SRC_PARENT}/${SourceCodeOutput.SRC_TASKS}-${subfolder}`;
        const path = this.generateCode(dir);
        this.logOutput(`${message} source code written to `, path);
    }

    public ensureVoidReturns(): void {
        let count = 0;

        const funs = this.getValidFunctions();
        funs.forEach((fun) => {
            const vf = new Voidifier();

            if (fun.name == "main") {
                this.log("Skipping voidification of main(), which is part of the valid call graph for subset reduction");
            }
            else {
                const turnedVoid = vf.voidify(fun, DefaultPrefix.RETURN_VAR);
                count += turnedVoid ? 1 : 0;
            }
        });
        this.log(`Ensured ${count} function${count > 1 ? "s" : ""} return${count > 1 ? "s" : ""} void`);
        this.generateIntermediateCode("t2-voidification", "Voidified");
    }


    public outlineAll(): void {
        this.log("Finding code regions for outlining...");
        const topFun = this.getTopFunctionName();
        const outputDir = this.getOutputDir();
        const appName = this.getAppName();
        const finder = new OutlineRegionFinder(topFun, outputDir, appName);

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
        this.generateIntermediateCode("t3-replication", "Callspot-replicated");
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