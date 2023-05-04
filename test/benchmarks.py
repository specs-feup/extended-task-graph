# appName: (inputFolderName, outputFolderName, standard, toolConfig)
givenApps = {
    "scenarioA": ("scenarioA", ".", "c11", {"clock": 10}),
    "scenarioB": ("scenarioB", ".", "c11", {"clock": 10})
}

# appName: (canonicalName, inputSize, importPath, standard, config)
benchmarks = {
    "CHStone-adpcm": ("adpcm", "N", "lara.benchmark.CHStoneBenchmarkSet", "c11", {"clock": 10}),
    "CHStone-aes": ("aes", "N", "lara.benchmark.CHStoneBenchmarkSet", "c11", {"clock": 10}),
    "CHStone-blowfish": ("blowfish", "N", "lara.benchmark.CHStoneBenchmarkSet", "c11", {"clock": 10}),
    "CHStone-dfadd": ("dfadd", "N", "lara.benchmark.CHStoneBenchmarkSet", "c11", {"clock": 10}),
    "CHStone-dfdiv": ("dfdiv", "N", "lara.benchmark.CHStoneBenchmarkSet", "c11", {"clock": 10}),
    "CHStone-dfmul": ("dfmul", "N", "lara.benchmark.CHStoneBenchmarkSet", "c11", {"clock": 10}),
    "CHStone-dfsin": ("dfsin", "N", "lara.benchmark.CHStoneBenchmarkSet", "c11", {"clock": 10}),
    "CHStone-gsm": ("gsm", "N", "lara.benchmark.CHStoneBenchmarkSet", "c11", {"clock": 10}),
    "CHStone-jpeg": ("jpeg", "N", "lara.benchmark.CHStoneBenchmarkSet", "c11", {"clock": 10}),
    "CHStone-mips": ("mips", "N", "lara.benchmark.CHStoneBenchmarkSet", "c11", {"clock": 10}),
    "CHStone-motion": ("motion", "N", "lara.benchmark.CHStoneBenchmarkSet", "c11", {"clock": 10}),
    "CHStone-sha": ("sha", "N", "lara.benchmark.CHStoneBenchmarkSet", "c11", {"clock": 10}),

    "HiFlipVX": ("v2", "N", "lara.benchmark.HiFlipVX", "c++11", {"clock": 10}),

    "Rosetta-3drendering": ("3d-rendering", "N", "lara.benchmark.RosettaBenchmarkSet", "c++11", {"clock": 10}),
    "Rosetta-digitrecog": ("digit-recognition", "N", "lara.benchmark.RosettaBenchmarkSet", "c++11", {"clock": 10}),
    "Rosetta-facedetect": ("face-detection", "N", "lara.benchmark.RosettaBenchmarkSet", "c++11", {"clock": 10}),
    "Rosetta-opticalflow-curr": ("optical-flow", "current", "lara.benchmark.RosettaBenchmarkSet", "c++11", {"clock": 10}),
    "Rosetta-opticalflow-sintel": ("optical-flow", "sintel", "lara.benchmark.RosettaBenchmarkSet", "c++11", {"clock": 10}),
    "Rosetta-spamfilter": ("spam-filter", "N", "lara.benchmark.RosettaBenchmarkSet", "c++11", {"clock": 10}),

}
