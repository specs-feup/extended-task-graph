"use strict";

laraImport("clava.Clava");
laraImport("UnnamedPartitioningTool");

function handleBenchmark(config) {

    laraImport("lara.benchmark.CHStoneBenchmarkSet");
    const benches = new CHStoneBenchmarkSet();

    benches.setBenchmarks(["aes"]);
    benches.setInputSizes(["N"]);

    for (var bench of benches) {
        bench.load();

        const config = {
            "appName": bench.getName(),
            //"statsOutputDir": "../test/output_stats/" + bench.getName(),
            "codeOutputDir": "../test/output_code/" + bench.getName(), // same as passed as an argument to Clava
        }

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