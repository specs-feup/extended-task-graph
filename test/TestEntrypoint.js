"use strict";

laraImport("clava.Clava");
laraImport("UnnamedPartitioningTool");

function handleBenchmark(config) {
    const suite = config["suite"];
    const benchmarkName = config["appName"];
    const benchmarkSize = config["inputSize"];
    const importPath = `lara.benchmark.${suite}BenchmarkSet`;

    laraImport(importPath);
    const benches = eval(`new ${suite}BenchmarkSet();`);

    benches.setBenchmarks(benchmarkName);
    benches.setInputSizes(benchmarkSize);

    for (var bench of benches) {
        bench.load();
        const fullName = bench.getName();
        config["statsOutputDir"] += "/" + fullName;
        config["codeOutputDir"] += "/" + fullName;
        config["appName"] = fullName;

        const upt = new UnnamedPartitioningTool(config);
        upt.run();

        Clava.writeCode(config["codeOutputDir"]);
    }
}

function handleGivenApp(config) {
    const upt = new UnnamedPartitioningTool(config);
    upt.run();
}

function main() {
    const json = Io.readJson("../test/temp/config.json");

    if (json["inputType"] === "benchmark") {
        handleBenchmark(json);
    } else if (json["inputType"] === "givenApp") {
        handleGivenApp(json);
    } else {
        throw "Invalid input type";
    }
}

main();

