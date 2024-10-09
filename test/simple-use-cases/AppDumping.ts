/**
 * This is a simple use case that demonstrates how to dump the AST and the call graphs of an application.
 * i.e., the first two stages of the Code Transformation Flow (we are skipping the last stage, which is the code transformation itself).
 * 
 * To run as a test: `npm run simple-appdump`
 * To run directly on clava, if you have it installed globally: `clava dist/test/simple-use-cases/AppDumping.js -- clang inputs/edgedetect/`
 * 
 * It uses the edge detection application in `inputs/edgedetect/`. Replace as needed.
 */
import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";

console.log("Running the code transformation flow...");

const api = new ExtendedTaskGraphAPI("edgedetect", "output", "edgedetect-simple-appdump");
const success = api.runCodeTransformationFlow(true, true, false);
console.log(success ? "Code transformation succeeded" : "Code transformation failed");