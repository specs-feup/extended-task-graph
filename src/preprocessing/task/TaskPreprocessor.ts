import { AStage } from "../../AStage.js";
import { AppTimerInserter } from "./AppTimerInserter.js";
import { ReplicaCreator } from "./ReplicaCreator.js";
import { OutlineRegionFinder } from "./OutlineRegionFinder.js";
import { DefaultPrefix } from "../../api/PreSuffixDefaults.js";
import { Voidifier } from "@specs-feup/clava-code-transforms/Voidifier";
import { SourceCodeOutput } from "../../api/OutputDirectories.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { FunctionJp, ReturnStmt } from "@specs-feup/clava/api/Joinpoints.js";

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
                this.log("  Skipping voidification of main(), which is part of the valid call graph for subset reduction");
            }
            else {
                const turnedVoid = vf.voidify(fun, DefaultPrefix.RETURN_VAR, true);
                count += turnedVoid ? 1 : 0;
                if (turnedVoid) {
                    this.log(`  Function "${fun.name}" return type changed to void`);
                }
                else {
                    this.log(`  Function "${fun.name}" already has void return type`);
                }
                this.removeVoidReturn(fun);
            }
        });
        this.log(`Ensured ${count} function${count > 1 ? "s" : ""} return${count > 1 ? "s" : ""} void`);
        this.generateIntermediateCode("t2-voidification", "Voidified");
    }

    public removeVoidReturn(fun: FunctionJp): void {
        const stmts = fun.body.stmts;
        const lastStmt = stmts.at(-1);
        if (lastStmt == null) {
            return;
        }
        if (lastStmt instanceof ReturnStmt && lastStmt.children.length == 0) {
            lastStmt.detach();
            this.log(`  Removed void return statement from function "${fun.name}"`);
        }
    }

    public outlineAll(maxIter: number = 15): boolean {
        this.log("Finding code regions for outlining...");
        const topFun = this.getTopFunctionName();
        const outputDir = this.getOutputDir();
        const appName = this.getAppName();
        const finder = new OutlineRegionFinder(topFun, outputDir, appName);
        let keepRunning = true;
        let totalOutlined = 0;
        let n = 1;
        let prevOutlinedFuns: FunctionJp[] = [];

        while (keepRunning) {
            this.log(`Outlining iteration ${n}...`);
            try {
                const newFuns = finder.outlineRegions(n);
                const nNewFuns = newFuns.length;
                Clava.rebuild();

                if (nNewFuns > 0) {
                    this.log(`Outlined ${nNewFuns} generic regions`);
                    totalOutlined += nNewFuns;

                    if (n > 1) {
                        keepRunning = !this.checkEarlyStop(prevOutlinedFuns, newFuns);
                    }
                    prevOutlinedFuns = newFuns;
                }
                else {
                    this.log("No generic regions found for outlining");
                }

                if (nNewFuns === 0) {
                    this.log("No more regions found for outlining");
                    keepRunning = false;
                }
                n += 1;
                if (n > maxIter) {
                    this.logWarning(`Exceeded maximum number of outlining iterations (${maxIter})`);
                    this.logWarning("Verify that the outlined regions are valid");
                    keepRunning = false;
                }
                this.logLine(`Outlined ${nNewFuns} generic regions`.length);
            }
            catch (e) {
                this.log(`Error during outlining iteration ${n}: ${(e as Error).message}`);
                throw e;
            }

        }
        this.log(`Total outlined regions: ${totalOutlined}`);

        return finder.updateDecls();
    }

    private checkEarlyStop(prevOutlined: FunctionJp[], currentOutlined: FunctionJp[]): boolean {
        if (prevOutlined.length !== currentOutlined.length) {
            return false;
        }
        for (let i = 0; i < prevOutlined.length; i++) {
            const prev = prevOutlined[i].name;
            const curr = currentOutlined[i].name;

            const prevSplit = prev.split("_");
            const currSplit = curr.split("_");
            if (prevSplit.length !== currSplit.length) {
                return false;
            }
            for (let j = 0; j < prevSplit.length; j++) {
                if (prevSplit[j].startsWith("out") && currSplit[j].startsWith("out")) {
                    continue;
                }
                else {
                    if (prevSplit[j] !== currSplit[j]) {
                        return false;
                    }
                }
            }
        }
        this.log("Outlined functions are the same as in the previous iteration");
        this.log("Stopping further outlining iterations to prevent infinite loop");
        return true;
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