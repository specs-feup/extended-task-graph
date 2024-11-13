import { runEtgForBenchmark } from "./benchrunner/BenchmarkRunner.js";
import { SuiteSelector } from "./benchrunner/SuiteSelector.js";

const suite = SuiteSelector.ROSETTA;

const apps = [
    //"3d-rendering",
    //"digit-recognition",
    //"face-detection",
    "optical-flow",
    //"spam-filter"
];

const settings = {
    disableCaching: true,
    outputDir: "output/rosetta",
    dumpAST: true,
    doTransformations: true,
    dumpCallGraph: true,
    generateGraph: true,
    gatherMetrics: true,
}

runEtgForBenchmark(suite, apps, settings);