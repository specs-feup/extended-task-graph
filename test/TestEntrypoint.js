"use strict";

laraImport("clava.Clava");
laraImport("UnnamedPartitioningTool");

function handleBenchmark(config) {
    const benchmarkName = laraArgs["benchName"];
    const suite = laraArgs["suite"];
    const benchmarkSize = laraArgs["inputSize"];
    const importPath = `lara.benchmark.${suite}BenchmarkSet`;

    laraImport(importPath);
    const benches = eval(`new ${suite}BenchmarkSet();`);

    benches.setBenchmarks(benchmarkName);
    benches.setInputSizes(benchmarkSize);

    for (var bench of benches) {
        bench.load();
        const upt = new UnnamedPartitioningTool(config);
        upt.run();
    }
}

function handleApp(config) {
    const upt = new UnnamedPartitioningTool(config);
    upt.run();
}

function main() {
    const json = Io.readJson("../test/temp/config.json");

    if (laraArgs["inputType"] === "bench") {
        handleBenchmark(json);
    } else if (laraArgs["inputType"] === "app") {
        handleApp(json);
    } else {
        throw "Invalid input type";
    }
}

main();

