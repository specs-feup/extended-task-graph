/**
 * This is a simple use case that demonstrates how to dump the AST and the call graphs of an application.
 * i.e., the first two stages of the Code Transformation Flow (we are skipping the last stage, which is the code transformation itself).
 * 
 * To run as a test: `npm run simple-appdump`
 * To run directly on clava, if you have it installed globally: `clava dist/test/simple-use-cases/AppDumping.js -- clang inputs/edgedetect/`
 * 
 * It uses the edge detection application in `inputs/edgedetect/`. Replace as needed.
 * 
 * Check the output in the output/apps/edgedetect-simple-appdump folder. You can set this to whatever you want, but you may want to organize
 * it in a way that makes sense for your project and the amount and type of applications you are analyzing.
 */
import chalk from "chalk";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";
import { TransFlowConfig } from "../../src/api/TransFlowConfig.js";
console.log("Test: dump the AST and call graph of edgedetect");

const topFunctionName = "edge_detect";
const outputDir = "output/use-cases";
const appName = "edgedetect-appdump";
const api = new ExtendedTaskGraphAPI(topFunctionName, outputDir, appName);

const config = new TransFlowConfig();
config.doTransforms = false;

const success = api.runCodeTransformationFlow(config);

console.log(success ?
    chalk.green("Test passed") + ": dumping succeeded" :
    chalk.red("Test failed") + ": dumping failed");