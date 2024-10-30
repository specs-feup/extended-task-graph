import { runEtgForBenchmark } from "./benchrunner/BenchmarkRunner.js";
import { SuiteSelector } from "./benchrunner/SuiteSelector.js";

const suite = SuiteSelector.RODINIA;

const apps = [
    "backprop",
    "bfs",
    "b+tree",
    "cfd-euler3d",
    "cfd-euler3d-double",
    "cfd-pre-euler3d",
    "cfd-pre-euler3d-double",
    "heartwall",
    "hotspot",
    "hotspot3D",
    "kmeans",
    "lavaMD",
    "leukocyte",
    "lud",
    "myocyte",
    "nn",
    "nw",
    "particlefilter",
    "pathfinder",
    "srad-v1",
    "srad-v2",
    "streamcluster"
];

const settings = {
    disableCaching: false,
    outputDir: "output/rodinia",
    dumpAST: true,
    doTransformations: true,
    dumpCallGraph: true,
    generateGraph: true,
    gatherMetrics: true,
}

runEtgForBenchmark(suite, apps, settings);