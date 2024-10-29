import { runEtgForBenchmark } from "./BenchmarkRunner.js";
import { BenchmarkSuite } from "./LiteBenchmarkLoader.js";
import { SuiteSelector } from "./SuiteSelector.js";

const rosettaSuite: BenchmarkSuite = SuiteSelector.ROSETTA;

const settings = {
    disableCaching: false,
    outputDir: "output/rosetta",
    dumpAST: true,
    doTransformations: true,
    dumpCallGraph: true,
    generateGraph: true,
    gatherMetrics: true,
}

const apps = [
    "3d-rendering",
    //"digit-recognition",
    //"face-detection",
    //"optical-flow",
    //"spam-filter"
];

runEtgForBenchmark(rosettaSuite, apps, settings);