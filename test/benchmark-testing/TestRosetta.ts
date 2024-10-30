import { runEtgForBenchmark } from "./BenchmarkRunner.js";
import { BenchmarkSuite } from "./LiteBenchmarkLoader.js";
import { SuiteSelector } from "./SuiteSelector.js";

const rosettaSuite: BenchmarkSuite = SuiteSelector.ROSETTA;

const apps = [
    //"3d-rendering",
    //"digit-recognition",
    //"face-detection",
    //"optical-flow",
    "spam-filter"
];

const settings = {
    disableCaching: false,
    outputDir: "output/rosetta",
    dumpAST: true,
    doTransformations: true,
    dumpCallGraph: true,
    generateGraph: true,
    gatherMetrics: true,
}

runEtgForBenchmark(rosettaSuite, apps, settings);