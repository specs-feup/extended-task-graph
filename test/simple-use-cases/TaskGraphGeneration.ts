import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";

const api = new ExtendedTaskGraphAPI("edgedetect", "output", "edgedetect-simple-etg");
const etg = api.runTaskGraphGenerationFlow(true, false);

if (etg == null) {
    console.log("ETG construction failed");
} else {
    console.log("ETG construction succeeded");
    // do whatever you want with the graph...
}
