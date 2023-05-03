"use strict";

laraImport("lara.benchmark.CHStoneBenchmarkSet");
laraImport("clava.Clava");
laraImport("UnnamedPartitioningTool");

function main() {

    const benches = new CHStoneBenchmarkSet();

    benches.setBenchmarks(["aes"]);
    benches.setInputSizes(["N"]);

    for (var bench of benches) {
        bench.load();

        const config = {
            "statsOutputDir": "../test/output_stats"
        }

        const upt = new UnnamedPartitioningTool(config);
        upt.run();

        Clava.writeCode("../test/output_code");
    }

}

main();