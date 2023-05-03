"use strict";


laraImport("clava.Clava");
laraImport("UnnamedPartitioningTool");

function main() {

    laraImport("lara.benchmark.CHStoneBenchmarkSet");
    const benches = new CHStoneBenchmarkSet();

    benches.setBenchmarks(["aes"]);
    benches.setInputSizes(["N"]);

    for (var bench of benches) {
        bench.load();

        const config = {
            "appName": bench.getName(),
            "statsOutputDir": "../test/output_stats/" + bench.getName(),
            "codeOutputDir": "../test/output_code/" + bench.getName(), // same as passed as an argument to Clava
        }

        const upt = new UnnamedPartitioningTool(config);
        upt.run();

        Clava.writeCode(config["codeOutputDir"]);
    }

}

main();