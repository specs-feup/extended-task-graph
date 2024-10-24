import { LiteBenchmarkLoader, BenchmarkSuite } from "./LiteBenchmarkLoader.js";
import { SuiteSelector } from "./SuiteSelector.js";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";

const genericAppSuite: BenchmarkSuite = SuiteSelector.APPS;

const apps = [
    "cluster-scenario",
    "disparity",
    "edgedetect",
    "scenarioA",
    "scenarioB",
    "stresstest",
    "trivial"
];

for (const app of apps) {
    console.log(app);

    const topFunctionName = LiteBenchmarkLoader.load(genericAppSuite, app);
    const outputDir = "output/apps";
    const api = new ExtendedTaskGraphAPI(topFunctionName, outputDir, app);

    const dumpAST = true;
    const dumpCallGraph = true;
    const doTransformations = true;
    const generateGraph = true;
    const gatherMetrics = true;

    api.runCodeTransformationFlow(dumpCallGraph, dumpAST, doTransformations);
    api.runTaskGraphGenerationFlow(generateGraph, gatherMetrics);
}
