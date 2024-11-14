import { TransFlowConfig } from "../../src/api/CodeTransformationFlow.js";
import { GenFlowConfig } from "../../src/api/TaskGraphGenerationFlow.js";
import { SubsetTransform } from "../../src/preprocessing/subset/SubsetPreprocessor.js";
import { runEtgForBenchmark } from "./benchrunner/BenchmarkRunner.js";
import { SuiteSelector } from "./benchrunner/SuiteSelector.js";

const settings = {
    suite: SuiteSelector.APPS,
    apps: [
        "cluster-scenario",
        "disparity",
        "edgedetect",
        "scenarioA",
        "scenarioB",
        "stresstest",
        "trivial"
    ],
    disableCaching: true,
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

runEtgForBenchmark(settings);