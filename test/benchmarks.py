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
    "MachSuite-aes-D": (
        "c11",
        {
            "starterFunction": "aes256_encrypt_ecb",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "MachSuite-backprop-D": (
        "c11",
        {
            "starterFunction": "backprop",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "MachSuite-bfs-bulk-D": (
        "c11",
        {
            "starterFunction": "bfs",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "MachSuite-bfs-queue-D": (
        "c11",
        {
            "starterFunction": "bfs",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "MachSuite-fft-strided-D": (
        "c11",
        {
            "starterFunction": "fft",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "MachSuite-fft-transpose-D": (
        "c11",
        {
            "starterFunction": "fft1D_512",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "MachSuite-gemm-blocked-D": (
        "c11",
        {
            "starterFunction": "bbgemm",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "MachSuite-gemm-ncubed-D": (
        "c11",
        {
            "starterFunction": "gemm",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),  
    "MachSuite-kmp-D": (
        "c11",
        {
            "starterFunction": "kmp",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),    
    "MachSuite-md-grid-D": (
        "c11",
        {
            "starterFunction": "md",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),    
    "MachSuite-md-knn-D": (
        "c11",
        {
            "starterFunction": "md_kernel",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),    
    "MachSuite-nw-D": (
        "c11",
        {
            "starterFunction": "needwun",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),    
    "MachSuite-sort-merge-D": (
        "c11",
        {
            "starterFunction": "ms_mergesort",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),    
    "MachSuite-sort-radix-D": (
        "c11",
        {
            "starterFunction": "ss_sort",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),    
    "MachSuite-spmv-crs-D": (
        "c11",
        {
            "starterFunction": "spmv",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),    
    "MachSuite-spmv-ellpack-D": (
        "c11",
        {
            "starterFunction": "ellpack",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),    
    "MachSuite-stencil-2d-D": (
        "c11",
        {
            "starterFunction": "stencil",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),    
    "MachSuite-stencil-3d-D": (
        "c11",
        {
            "starterFunction": "stencil3d",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
    "MachSuite-viterbi-D": (
        "c11",
        {
            "starterFunction": "viterbi",
            "clock": 10,
            "targetPart": "xcvu5p-flva2104-1-e",
            "cpuEstim": "estim_perf_precalc.json",
            "fpgaEstim": "estim_vitishls_precalc.json",
        },
    ),
}
