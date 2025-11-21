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
        const dir = `${SourceCodeOutput.SRC_PARENT}/${SourceCodeOutput.SRC_TASKS}/${subfolder}`;
        const path = this.generateCode(dir);
        this.logOutput(`${message} source code written to `, path);
    }

    public ensureVoidReturns(): void {
        let count = 0;

        const funs = this.getValidFunctions();
        this.log(`There are ${funs.length} functions in the working AST region`);

        funs.forEach((fun) => {
            const vf = new Voidifier();

            if (fun.name == "main") {
                this.log("Skipping voidification of main(), which is part of the valid call graph for subset reduction");
            }
            else {
                const turnedVoid = vf.voidify(fun, DefaultPrefix.RETURN_VAR, true);
                count += turnedVoid ? 1 : 0;
                if (turnedVoid) {
                    this.log(`  "${fun.name}" return type changed to void`);
                }
                else {
                    this.log(`  "${fun.name}" already has void return type`);
                }
            }
        });
        this.log(`Ensured ${count} function${count > 1 ? "s" : ""} return${count > 1 ? "s" : ""} void`);
        this.generateIntermediateCode("t2-voidification", "Voidified");
    }

    public outlineAll(maxIter: number = 100): boolean {
        this.log("Finding code regions for outlining...");
        const topFun = this.getTopFunctionName();
        const outputDir = this.getOutputDir();
        const appName = this.getAppName();
        const finder = new OutlineRegionFinder(topFun, outputDir, appName);
        let keepRunning = true;
        let totalOutlined = 0;
        let n = 1;

        while (keepRunning) {
            let genCnt = 0;

            try {
                genCnt = finder.outlineGenericRegions(n);
                Clava.rebuild();
            }
            catch (e) {
                this.log(`Error during outlining iteration ${n}: ${(e as Error).message}`);
                throw e;
            }

            if (genCnt > 0) {
                this.log(`Outlined ${genCnt} generic regions`);
                totalOutlined += genCnt;
            }
            else {
                this.log("No generic regions found for outlining");
            }

            if (genCnt === 0) {
                this.log("No more regions found for outlining");
                keepRunning = false;
            }
            n += 1;
            if (n > maxIter) {
                throw new Error(`Exceeded maximum number of outlining iterations (${maxIter})`);
            }
        }
        this.log(`Total outlined regions: ${totalOutlined}`);

        return finder.updateDecls();
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