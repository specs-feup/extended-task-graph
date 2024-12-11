import { SuiteSelector } from "clava-lite-benchmarks/SuiteSelector";
import { SubsetTransform } from "../../src/preprocessing/subset/SubsetPreprocessor.js";
import { TransFlowConfig } from "../../src/api/TransFlowConfig.js";
import { GenFlowConfig } from "../../src/api/GenFlowConfig.js";
import { EtgSuiteRunner } from "./EtgSuiteRunner.js";

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
    outputDir: "output/rosetta",
    codeConfig: new TransFlowConfig(),
    etgConfig: new GenFlowConfig()
}
settings.codeConfig.transformRecipe = [
    SubsetTransform.ArrayFlattener,
    SubsetTransform.ConstantFoldingPropagation,
    SubsetTransform.StructDecomposition,
    SubsetTransform.SwitchToIf,
    SubsetTransform.ConstantFoldingPropagation
];
const disableCaching = false;

const runner = new EtgSuiteRunner();
runner.runScriptForSuite(suite, apps, settings, disableCaching);