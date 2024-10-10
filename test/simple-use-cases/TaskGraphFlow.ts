import { ExtendedTaskGraphAPI } from "../../src/api/ExtendedTaskGraphAPI.js";

const api = new ExtendedTaskGraphAPI("edgedetect", "output/apps", "edgedetect-etg");
const etg = api.runTaskGraphGenerationFlow(true, true);

if (etg == null) {
    console.log("ETG construction failed");
} else {
    console.log("ETG construction succeeded");
    // do whatever you want with the graph...
}
