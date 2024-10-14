import { BenchmarkSuite } from "./BenchmarkLoader.js";

const genericSuite: BenchmarkSuite = {
    name: "TestApps",
    path: "inputs/",
    apps: {
        "disparity": { standard: "c11", topFunction: "top_level", input: "disparity" },
        "edgedetect": { standard: "c++11", topFunction: "edge_detect", input: "edgedetect" },
        "stresstest": { standard: "c++11", topFunction: "app_start", input: "stresstest" },
        "scenarioA": { standard: "c11", topFunction: "main", input: "scenarioA" },
        "scenarioB": { standard: "c11", topFunction: "scenario", input: "scenarioB" },
        "trivial": { standard: "c11", topFunction: "main", input: "trivial" },
    }
};