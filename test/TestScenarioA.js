"use strict";

laraImport("UnnamedPartitioningTool");

function main() {
    const config = {
        "statsOutputDir": "../test/output_stats"
    }

    const upt = new UnnamedPartitioningTool(config);
    upt.run();
}

main();