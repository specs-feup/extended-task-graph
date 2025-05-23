import { TransFlowConfig } from "../../src/api/TransFlowConfig.js";
import { GenFlowConfig } from "../../src/api/GenFlowConfig.js";
import { testAnyApp } from "./TestAnyApp.js";

const appName = "llama2";
const topFunctionName = "llama2_loop";
const outputFolder = "output/local-apps";

const transConfig = new TransFlowConfig();
transConfig.transformRecipe = [];
transConfig.dumpAST = true;
transConfig.dumpCallGraph = true;

const genConfig = new GenFlowConfig();
genConfig.enabled = false;

testAnyApp(appName, topFunctionName, outputFolder, transConfig, genConfig);