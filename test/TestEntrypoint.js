"use strict";

laraImport("clava.Clava");
laraImport("UnnamedPartitioningTool");

function handleBenchmarkCodeFlow(config) {
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

function handleAppCodeFlow(config) {
    const upt = new UnnamedPartitioningTool(config);
    upt.runCodeTransformationFlow();


}

function codeFlow(config) {
    if (laraArgs["inputType"] === "bench") {
        handleBenchmarkCodeFlow(config);
    }
    else if (laraArgs["inputType"] === "app") {
        handleAppCodeFlow(config);
    }
    else {
        println("Invalid application input type");
        return -1;
    }
    return 0;
}

function holisticFlow(config) {

}

function main() {
    const config = Io.readJson("../test/temp/config.json");

    if (laraArgs["flow"] === "code") {
        codeFlow(config);
    }
    else if (laraArgs["flow"] === "holistic") {
        holisticFlow(config);
    }
    else {
        println("Invalid flow");
        return -1;
    }
    return 0;
}

main();

