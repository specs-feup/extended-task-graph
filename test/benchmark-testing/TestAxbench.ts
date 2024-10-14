import { BenchmarkSuite } from "./BenchmarkLoader.js";

const axBenchSuite: BenchmarkSuite = {
    name: "AxBench",
    path: "clava-benchmarks/AxSuite/lara/benchmark/",
    apps: {
        "blackscholes": { standard: "c++17", topFunction: "BlkSchlsEqEuroNoDiv" },
        "fft": { standard: "c++17", topFunction: "radix2DitCooleyTykeyFft" },
        "inversek2j": { standard: "c++17", topFunction: "main" },
        "jmeint": { standard: "c++17", topFunction: "main" },
        "jpeg": { standard: "c++17", topFunction: "main" },
        "kmeans": { standard: "c++17", topFunction: "segmentImage" },
        "sobel": { standard: "c++17", topFunction: "main" },
    }
};