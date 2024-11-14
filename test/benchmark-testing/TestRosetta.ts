import { runEtgForBenchmark } from "./benchrunner/BenchmarkRunner.js";
import { SuiteSelector } from "./benchrunner/SuiteSelector.js";
import { SubsetPreprocessor, SubsetTransform } from "../../src/preprocessing/subset/SubsetPreprocessor.js";

const suite = SuiteSelector.ROSETTA;

const apps = [
    //"3d-rendering",         // not ok
    //"digit-recognition",  // ok
    //"face-detection",     // not ok
    //"optical-flow",       // ok
    "spam-filter"         // ok
];

const settings = {
    disableCaching: true,
    outputDir: "output/rosetta",
    dumpAST: true,
    doTransformations: true,
    dumpCallGraph: true,
    generateGraph: true,
    gatherMetrics: true,
    //transRecipe: SubsetPreprocessor.DEFAULT_RECIPE,
    transRecipe: [
        SubsetTransform.ArrayFlattener,
        SubsetTransform.ConstantFoldingPropagation,
        SubsetTransform.StructDecomposition,
        SubsetTransform.SwitchToIf,
        SubsetTransform.ConstantFoldingPropagation
    ]
}

runEtgForBenchmark(suite, apps, settings);