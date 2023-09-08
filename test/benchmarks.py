# appName: (standard, config)
apps = {
    "edgedetect": (
        "c++11",
        {"clock": 10, "starterFunction": "edge_detect"},
    ),
    "stresstest": (
        "c++11",
        {"clock": 10, "starterFunction": "app_start"},
    ),
    "scenarioA": ("c11", {"clock": 10, "starterFunction": "main"}),
    "scenarioB": (
        "c11",
        {"clock": 10, "starterFunction": "scenario"},
    ),
}

# appName: (standard, config)
benchmarks = {
    "CHStone-adpcm-N": (
        "c11",
        {"clock": 10, "starterFunction": "adpcm_main"},
    ),
    "CHStone-aes-N": (
        "c11",
        {"clock": 10, "starterFunction": "aes_main"},
    ),
    "CHStone-blowfish-N": (
        "c11",
        {"clock": 10, "starterFunction": "blowfish_main"},
    ),
    "CHStone-dfadd-N": (
        "c11",
        {"clock": 10, "starterFunction": "float64_add"},
    ),
    "CHStone-dfdiv-N": (
        "c11",
        {"clock": 10, "starterFunction": "float64_div"},
    ),
    "CHStone-dfmul-N": (
        "c11",
        {"clock": 10, "starterFunction": "float64_mul"},
    ),
    "CHStone-dfsin-N": (
        "c11",
        {"clock": 10, "starterFunction": "_sin"},
    ),
    "CHStone-gsm-N": (
        "c11",
        {"clock": 10, "starterFunction": "Gsm_LPC_Analysis"},
    ),
    "CHStone-jpeg-N": (
        "c11",
        {"clock": 10, "starterFunction": "jpeg2bmp_main"},
    ),
    "CHStone-mips-N": (
        "c11",
        {"clock": 10, "starterFunction": "mips"},
    ),
    "CHStone-motion-N": (
        "c11",
        {"clock": 10, "starterFunction": "main"},
    ),
    "CHStone-sha-N": (
        "c11",
        {"clock": 10, "starterFunction": "sha_stream"},
    ),
    "HiFlipVX-v2-N": (
        "c++11",
        {"clock": 10, "starterFunction": "main"},
    ),
    "Rosetta-3d-rendering-N": (
        "c++11",
        {"clock": 10, "starterFunction": "rendering_sw"},
    ),
    "Rosetta-digit-recognition-N": (
        "c++11",
        {"clock": 10, "starterFunction": "DigitRec_sw"},
    ),
    "Rosetta-face-detection-N": (
        "c++11",
        {"clock": 10, "starterFunction": "face_detect_sw"},
    ),
    "Rosetta-optical-flow-current": (
        "c++11",
        {"clock": 10, "starterFunction": "optical_flow_sw"},
    ),
    "Rosetta-optical-flow-sintel": (
        "c++11",
        {"clock": 10, "starterFunction": "optical_flow_sw"},
    ),
    "Rosetta-spam-filter-N": (
        "c++11",
        {"clock": 10, "starterFunction": "SgdLR_sw"},
    ),
}
