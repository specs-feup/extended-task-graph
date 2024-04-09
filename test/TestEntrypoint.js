"use strict";

laraImport("clava.Clava");
laraImport("flextask.FlextaskAPI");


function main() {
    const config = Io.readJson("test/temp/config.json");

    if (config["provenance"] == "BUILTIN") {
        const appName = config["appName"];
        const splitName = appName.split("-");

        const suite = splitName[0];
        const benchmarkName = splitName.slice(1, -1).join("-");
        const benchmarkSize = splitName[splitName.length - 1];

        const importPath = `lara.benchmark.${suite}BenchmarkSet`;
        laraImport(importPath);
        const benches = eval(`new ${suite}BenchmarkSet();`);

        benches.setBenchmarks(benchmarkName);
        benches.setInputSizes(benchmarkSize);

        for (var bench of benches) {
            bench.load();
            break;
        }
    }
    const appName = config["appName"];
    const outputDir = config["outputDir"];
    const topFunctionName = config["starterFunction"];

    const doTransforms = !config["skipTransforms"];
    const doTaskGraph = !config["skipTaskGraph"];

    const api = new FlextaskAPI(topFunctionName, outputDir, appName);

    const success = api.runCodeTransformationFlow(true, true, doTransforms);
    if (!success) {
        this.log("Code transformation flow failed, aborting task graph generation flow");
    }
    else if (doTaskGraph) {
        api.runTaskGraphGenerationFlow(true, true, false);
    }
}

main();