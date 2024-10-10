import { AppSummary } from "./AppSummary.js";

const apps: Record<string, AppSummary> = {
    "disparity": { standard: "c11", topFunction: "top_level", input: "inputs/disparity" },
    "edgedetect": { standard: "c++11", topFunction: "edge_detect", input: "inputs/edgedetect" },
    "stresstest": { standard: "c++11", topFunction: "app_start", input: "inputs/stresstest" },
    "scenarioA": { standard: "c11", topFunction: "main", input: "inputs/scenarioA" },
    "scenarioB": { standard: "c11", topFunction: "scenario", input: "inputs/scenarioB" },
    "trivial": { standard: "c11", topFunction: "main", input: "inputs/trivial" },
};