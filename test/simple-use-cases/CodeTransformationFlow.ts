import chalk from "chalk";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";

console.log("Test: run the entire code transformation flow using edgedetect as the input");

const topFunctionName = "edge_detect";
const outputDir = "output/use-cases";
const appName = "edgedetect-transflow";
const api = new ExtendedTaskGraphAPI(topFunctionName, outputDir, appName);

let success: boolean = false;
try {
    success = api.runCodeTransformationFlow();
} catch (e) {
    console.error(e);
    success = false;
}

console.log(success ?
    chalk.green("Test passed") + ": TransFlow succeeded" :
    chalk.red("Test failed") + ": TransFlow failed");