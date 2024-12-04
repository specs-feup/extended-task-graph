import { SubsetTransform } from "../../src/preprocessing/subset/SubsetPreprocessor.js";;
import { SuiteSelector } from "clava-lite-benchmarks/SuiteSelector";
import { runEtgForBenchmark } from "./BenchmarkRunner.js";
import { TransFlowConfig } from "../../src/api/TransFlowConfig.js";
import { GenFlowConfig } from "../../src/api/GenFlowConfig.js";

const settings = {
    suite: SuiteSelector.ROSETTA,
    apps: [
        // not ok
        //"3d-rendering",
        // ok
        //"digit-recognition",
        // not ok
        //"face-detection",
        // ok
        //"optical-flow",
        // ok
        "spam-filter"
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