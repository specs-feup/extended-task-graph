import { LiteBenchmarkLoader, BenchmarkSuite } from "./LiteBenchmarkLoader.js";
import { SuiteSelector } from "./SuiteSelector.js";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";

const rosettaSuite: BenchmarkSuite = SuiteSelector.ROSETTA;

for (const app of rosettaSuite.apps) {
    console.log(app);

    console.log("Running the code transformation flow...");

    const topFunctionName = LiteBenchmarkLoader.load(rosettaSuite, app);
    const outputDir = "output/rosetta";
    const api = new ExtendedTaskGraphAPI(topFunctionName, outputDir, app);

    const dumpAST = true;
    const dumpCallGraph = true;
    const doTransformations = false;
    const success = api.runCodeTransformationFlow(dumpCallGraph, dumpAST, doTransformations);

    console.log(success ? "Code transformation succeeded" : "Code transformation failed");
}
