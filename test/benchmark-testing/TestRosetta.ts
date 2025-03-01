import { SubsetTransform } from "../../src/preprocessing/subset/SubsetPreprocessor.js";;
import { SuiteSelector } from "@specs-feup/clava-lite-benchmarks/SuiteSelector";
import { TransFlowConfig } from "../../src/api/TransFlowConfig.js";
import { GenFlowConfig } from "../../src/api/GenFlowConfig.js";
import { EtgSuiteRunner } from "./EtgSuiteRunner.js";

const suite = SuiteSelector.ROSETTA;
const apps = [
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