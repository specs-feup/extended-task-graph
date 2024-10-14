import { BenchmarkSuite } from "./BenchmarkLoader.js";

const cortexSuite_cortex: BenchmarkSuite = {
    name: "CortexSuite",
    path: "clava-benchmarks/CortexSuite/lara/benchmark/",
    apps: {
        "cortex-clustering-kmeans": { standard: "c11", topFunction: "main" },
        "cortex-clustering-spectral": { standard: "c11", topFunction: "main" },
        "cortex-cnn": { standard: "c11", topFunction: "main" },
        "cortex-lda": { standard: "c11", topFunction: "main" },
        "cortex-liblinear": { standard: "c11", topFunction: "main" },
        "cortex-motion-estimation": { standard: "c11", topFunction: "main" },
        "cortex-rbm": { standard: "c11", topFunction: "main" },
        "cortex-sphinx": { standard: "c11", topFunction: "main" },
        "cortex-srr": { standard: "c11", topFunction: "main" },
        "cortex-svd3": { standard: "c11", topFunction: "main" },
        "cortex-word2vec-compute-accuracy": { standard: "c11", topFunction: "main" },
        "cortex-word2vec-distance": { standard: "c11", topFunction: "main" },
        "cortex-word2vec-word2phrase": { standard: "c11", topFunction: "main" },
        "cortex-word2vec-word2vec": { standard: "c11", topFunction: "main" },
        "cortex-word2vec-word-analogy": { standard: "c11", topFunction: "main" }
    }
};

const cortexSuite_vision: BenchmarkSuite = {
    name: "CortexSuite",
    path: "clava-benchmarks/CortexSuite/lara/benchmark/",
    apps: {
        "vision-disparity": { standard: "c11", topFunction: "getDisparity" },
        "vision-localization": { standard: "c11", topFunction: "main" },
        "vision-mser": { standard: "c11", topFunction: "main" },
        "vision-multicut": { standard: "c11", topFunction: "main" },
        "vision-pca": { standard: "c11", topFunction: "main" },
        "vision-sift": { standard: "c11", topFunction: "main" },
        "vision-stitch": { standard: "c11", topFunction: "main" },
        "vision-svm": { standard: "c11", topFunction: "main" },
        "vision-texture-synthesis": { standard: "c11", topFunction: "create_texture" },
        "vision-tracking": { standard: "c11", topFunction: "main" }
    }
};