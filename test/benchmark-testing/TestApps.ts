import { SuiteSelector } from "clava-lite-benchmarks/SuiteSelector";
import { SubsetTransform } from "../../src/preprocessing/subset/SubsetPreprocessor.js";
import { TransFlowConfig } from "../../src/api/TransFlowConfig.js";
import { GenFlowConfig } from "../../src/api/GenFlowConfig.js";
import { EtgSuiteRunner } from "./EtgSuiteRunner.js";

const suite = SuiteSelector.APPS;
const apps = [
    // "disparity",
    //"edgedetect",
    "llama2"
];
const settings = {
    outputDir: "output/apps",
    codeConfig: new TransFlowConfig(),
    etgConfig: new GenFlowConfig()
}
settings.codeConfig.transformRecipe = [
    SubsetTransform.ArrayFlattener,
    // SubsetTransform.ConstantFoldingPropagation,
    SubsetTransform.StructDecomposition,
    // SubsetTransform.SwitchToIf,
    // SubsetTransform.ConstantFoldingPropagation
];
const disableCaching = true;
settings.codeConfig.doTransforms = true;
settings.etgConfig.enabled = false;

const runner = new EtgSuiteRunner();
runner.runScriptForSuite(suite, apps, settings, disableCaching);