import { runEtgForBenchmark } from "./benchrunner/BenchmarkRunner.js";
import { SuiteSelector } from "./benchrunner/SuiteSelector.js";
import { SubsetTransform } from "../../src/preprocessing/subset/SubsetPreprocessor.js";
import { TransFlowConfig } from "../../src/api/CodeTransformationFlow.js";
import { GenFlowConfig } from "../../src/api/TaskGraphGenerationFlow.js";

const settings = {
    suite: SuiteSelector.ROSETTA,
    apps: [
        //"3d-rendering",         // not ok
        //"digit-recognition",  // ok
        //"face-detection",     // not ok
        //"optical-flow",       // ok
        "spam-filter"         // ok
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