import { LiteBenchmarkLoader, BenchmarkSuite } from "./LiteBenchmarkLoader.js";
import { SuiteSelector } from "./SuiteSelector.js";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";

const rosettaSuite: BenchmarkSuite = SuiteSelector.ROSETTA;
//const apps = rosettaSuite.apps;
const apps = [
    //"3d-rendering",
    //"digit-recognition",
    //"face-detection",
    "optical-flow",
    //"spam-filter"
];

for (const app of apps) {
    const outputDir = "output/rosetta";
    const cachedPath = `${outputDir}/${app}/src/trans`;

    let invalidCache = false;
    const topFunctionName = LiteBenchmarkLoader.load(rosettaSuite, app, cachedPath);

    if (topFunctionName === "<none>") {
        console.error(`Could not load cached app ${app}, loading full benchmark instead`);
        invalidCache = true;
    }
    else {
        console.log(`Loaded cached app ${app} with top function ${topFunctionName}`);
    }
    const api = new ExtendedTaskGraphAPI(topFunctionName, outputDir, app);

    if (invalidCache) {
        const dumpAST = true;
        const doTransformations = true;
        const dumpCallGraph = true;
        api.runCodeTransformationFlow(dumpCallGraph, dumpAST, doTransformations);
    }

    const generateGraph = true;
    const gatherMetrics = true;
    api.runTaskGraphGenerationFlow(generateGraph, gatherMetrics);
}
