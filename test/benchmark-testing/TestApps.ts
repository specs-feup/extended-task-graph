import { SuiteSelector } from "clava-lite-benchmarks/SuiteSelector";
import { SubsetTransform } from "../../src/preprocessing/subset/SubsetPreprocessor.js";
import { runEtgForBenchmark } from "./BenchmarkRunner.js";
import { TransFlowConfig } from "../../src/api/TransFlowConfig.js";
import { GenFlowConfig } from "../../src/api/GenFlowConfig.js";

const settings = {
    suite: SuiteSelector.APPS,
    apps: [
        // "cluster-scenario",
        // "disparity",
        "edgedetect",
        // "scenarioA",
        // "scenarioB",
        // "stresstest",
        // "trivial"
    ],
    disableCaching: true,
    outputDir: "output/apps",
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