"use strict";

laraImport("clava.Clava");
laraImport("UnnamedPartitioningTool");

function handleBenchmark(config) {
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
        const upt = new UnnamedPartitioningTool(config);
        upt.runBothFlows();
    }
}

function handleApp(config) {
    const upt = new UnnamedPartitioningTool(config);
    upt.runBothFlows();
}

function main() {
    const json = Io.readJson("../test/temp/config.json");

    if (laraArgs["inputType"] === "bench") {
        handleBenchmark(json);
    } else if (laraArgs["inputType"] === "app") {
        handleApp(json);
    } else {
        println("Invalid application input type");
        return -1;
    }
    return 0;
}

main();

