import { TransFlowConfig } from "../../src/api/TransFlowConfig.js";
import { GenFlowConfig } from "../../src/api/GenFlowConfig.js";
import { EtgSuiteRunner } from "./EtgSuiteRunner.js";
import { SPEC2017 } from "@specs-feup/clava-lite-benchmarks/BenchmarkSuites";

const suite = SPEC2017;
const apps = [
    // "disparity",
    //"edgedetect",
    //"llama2",
    "llama2-transformed"
];
const settings = {
    outputDir: "output/apps",
    codeConfig: new TransFlowConfig(),
    etgConfig: new GenFlowConfig()
}
settings.codeConfig.transformRecipe = [
    //SubsetTransform.ArrayFlattener,
    // SubsetTransform.ConstantFoldingPropagation,
    //SubsetTransform.StructDecomposition,
    // SubsetTransform.SwitchToIf,
    // SubsetTransform.ConstantFoldingPropagation
];
const disableCaching = true;
settings.etgConfig.enabled = false;

const runner = new EtgSuiteRunner();
runner.runScriptForSuite(suite, apps, settings, disableCaching);