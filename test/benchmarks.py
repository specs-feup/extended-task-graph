# appName: (inputFolderName, outputFolderName, standard, toolConfig)
apps = {
    "scenarioA": ("scenarioA", ".", "c11", {"clock": 10}),
    "scenarioB": ("scenarioB", ".", "c11", {"clock": 10})
}

# appName: (canonicalName, inputSize, suite, standard, config)
benchmarks = {
    "CHStone-adpcm": ("adpcm", "N", "CHStone", "c11", {"clock": 10}),
    "CHStone-aes": ("aes", "N", "CHStone", "c11", {"clock": 10}),
    "CHStone-blowfish": ("blowfish", "N", "CHStone", "c11", {"clock": 10}),
    "CHStone-dfadd": ("dfadd", "N", "CHStone", "c11", {"clock": 10}),
    "CHStone-dfdiv": ("dfdiv", "N", "CHStone", "c11", {"clock": 10}),
    "CHStone-dfmul": ("dfmul", "N", "CHStone", "c11", {"clock": 10}),
    "CHStone-dfsin": ("dfsin", "N", "CHStone", "c11", {"clock": 10}),
    "CHStone-gsm": ("gsm", "N", "CHStone", "c11", {"clock": 10}),
    "CHStone-jpeg": ("jpeg", "N", "CHStone", "c11", {"clock": 10}),
    "CHStone-mips": ("mips", "N", "CHStone", "c11", {"clock": 10}),
    "CHStone-motion": ("motion", "N", "CHStone", "c11", {"clock": 10}),
    "CHStone-sha": ("sha", "N", "CHStone", "c11", {"clock": 10}),

    "HiFlipVX": ("v2", "N", "HiFlipVX", "c++11", {"clock": 10}),

    "Rosetta-3drendering": ("3d-rendering", "N", "Rosetta", "c++11", {"clock": 10}),
    "Rosetta-digitrecog": ("digit-recognition", "N", "Rosetta", "c++11", {"clock": 10}),
    "Rosetta-facedetect": ("face-detection", "N", "Rosetta", "c++11", {"clock": 10}),
    "Rosetta-opticalflow-curr": ("optical-flow", "current", "Rosetta", "c++11", {"clock": 10}),
    "Rosetta-opticalflow-sintel": ("optical-flow", "sintel", "Rosetta", "c++11", {"clock": 10}),
    "Rosetta-spamfilter": ("spam-filter", "N", "Rosetta", "c++11", {"clock": 10}),

}
