import { runEtgForBenchmark } from "./benchrunner/BenchmarkRunner.js";
import { SuiteSelector } from "./benchrunner/SuiteSelector.js";

const suite = SuiteSelector.APPS;

const apps = [
    "cluster-scenario",
    "disparity",
    "edgedetect",
    "scenarioA",
    "scenarioB",
    "stresstest",
    "trivial"
];

const settings = {
    disableCaching: false,
    outputDir: "output/apps",
    dumpAST: true,
    doTransformations: true,
    dumpCallGraph: true,
    generateGraph: true,
    gatherMetrics: true,
}

runEtgForBenchmark(suite, apps, settings);