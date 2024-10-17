import chalk from "chalk";
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";

console.log("Test: run the entire code transformation flow using edgedetect as the input");

const topFunctionName = "edgedetect";
const outputDir = "output/apps";
const appName = "edgedetect-transflow";
const api = new ExtendedTaskGraphAPI(topFunctionName, outputDir, appName);

const dumpAST = true;
const dumpCallGraph = true;
const doTransformations = true;

let success: boolean = false;
try {
    success = api.runCodeTransformationFlow(dumpCallGraph, dumpAST, doTransformations);
} catch (e) {
    console.error(e);
    success = false;
}

console.log(success ?
    chalk.green("Test passed") + ": TransFlow succeeded" :
    chalk.red("Test failed") + ": TransFlow failed");