# appName: (standard, config)
apps = {
    "edgedetect": (
        "c++11",
        {
            "starterFunction": "edge_detect",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "stresstest": (
        "c++11",
        {
            "starterFunction": "app_start",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "scenarioA": (
        "c11",
        {
            "starterFunction": "main",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "scenarioB": (
        "c11",
        {
            "starterFunction": "scenario",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
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
        {
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "starterFunction": "rendering_sw",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "Rosetta-digit-recognition-N": (
        "c++11",
        {
            "starterFunction": "DigitRec_sw",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "Rosetta-face-detection-N": (
        "c++11",
        {
            "starterFunction": "face_detect_sw",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "Rosetta-optical-flow-current": (
        "c++11",
        {
            "starterFunction": "optical_flow_sw",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "Rosetta-optical-flow-sintel": (
        "c++11",
        {
            "starterFunction": "optical_flow_sw",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "Rosetta-spam-filter-N": (
        "c++11",
        {
            "starterFunction": "SgdLR_sw",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
}
