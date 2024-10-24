import { LiteBenchmarkLoader, BenchmarkSuite } from "./LiteBenchmarkLoader.js";
import { SuiteSelector } from "./SuiteSelector.js";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";

const rosettaSuite: BenchmarkSuite = SuiteSelector.ROSETTA;
//const apps = rosettaSuite.apps;
const apps = [
    //"3d-rendering",
    //"digit-recognition",
    //"face-detection",
    //"optical-flow",
    "spam-filter"
];

for (const app of apps) {
    console.log(app);

    const topFunctionName = LiteBenchmarkLoader.load(rosettaSuite, app);
    const outputDir = "output/rosetta";
    const api = new ExtendedTaskGraphAPI(topFunctionName, outputDir, app);

    const dumpAST = true;
    const dumpCallGraph = true;
    const doTransformations = true;
    const generateGraph = true;
    const gatherMetrics = true;

    api.runCodeTransformationFlow(dumpCallGraph, dumpAST, doTransformations);
    api.runTaskGraphGenerationFlow(generateGraph, gatherMetrics);
}
