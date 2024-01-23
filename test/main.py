import os


def main():
    os.chdir("src")
    test_apps()
    test_chstone()
    test_hiflipvx()
    test_rosetta()
    test_machsuite()
    print("All tests done!")


def test_apps():
    # test_app_flows("edgedetect", True, True, useHls=False)
    # test_app_flows("stresstest", False, True, useHls=False)
    # test_app_flows("scenarioA", True, True, useHls=True)
    # test_app_flows("scenarioB", True, True, useHls=True)
    pass


def test_chstone():
    # -----------------------------------
    # Benchmarks that run OK
    # -----------------------------------
    # test_bench_flows("CHStone-aes-N", True, True)
    # test_bench_flows("CHStone-blowfish-N", True, True)
    # test_bench_flows("CHStone-dfdiv-N", True, True)
    # test_bench_flows("CHStone-dfmul-N", True, True)
    # test_bench_flows("CHStone-gsm-N", True, True)
    # test_bench_flows("CHStone-mips-N", True, True)
    # test_bench_flows("CHStone-sha-N", True, True)
    # test_bench_flows("CHStone-motion-N", True, True)
    # test_bench_flows("CHStone-dfadd-N", True, True)
    # -----------------------------------
    # Benchmarks with errors
    # -----------------------------------
    # test_bench_flows("CHStone-adpcm-N", True, True)   # abs issue
    # test_bench_flows("CHStone-dfsin-N", True, True)  # label issue
    # test_bench_flows("CHStone-jpeg-N", True, True)  # bunch of issues
    pass


def test_hiflipvx():
    # test_bench_flows("HiFlipVX-v2-N", True, True)
    pass


def test_rosetta():
    stage_1 = True
    stage_2 = True
    # test_bench_flows("Rosetta-3d-rendering-N", stage_1, stage_2, useHls=False)
    # test_bench_flows("Rosetta-digit-recognition-N", stage_1, stage_2, useHls=False)
    # test_bench_flows("Rosetta-face-detection-N", stage_1, stage_2, useHls=False)
    # test_bench_flows("Rosetta-optical-flow-current", stage_1, stage_2, useHls=False)
    # test_bench_flows("Rosetta-spam-filter-N", stage_1, stage_2, useHls=False)
    pass


def test_machsuite():
    # -----------------------------------
    # Multi-task benchmarks
    # -----------------------------------
    # test_bench_flows("MachSuite-aes-D", False, True, useHls=False) # ERROR in creating decomps with void type
    # test_bench_flows("MachSuite-backprop-D", False, True, useHls=False) # some edge errors
    # test_bench_flows("MachSuite-fft-transpose-D", False, True, useHls=False) # some edge errors
    # test_bench_flows("MachSuite-kmp-D", True, False, useHls=False)
    # test_bench_flows("MachSuite-sort-merge-D", False, True, useHls=False)
    # test_bench_flows("MachSuite-sort-radix-D", False, True, useHls=False)
    # -----------------------------------
    # Single task benchmarks
    # -----------------------------------
    # test_bench_flows("MachSuite-bfs-bulk-D", True, True, useHls=False)
    # test_bench_flows("MachSuite-bfs-queue-D", True, True, useHls=False)
    # test_bench_flows("MachSuite-fft-strided-D", True, True, useHls=False)
    # test_bench_flows("MachSuite-gemm-blocked-D", True, True, useHls=False)
    # test_bench_flows("MachSuite-gemm-ncubed-D", True, True, useHls=False)
    # test_bench_flows("MachSuite-md-grid-D", True, True, useHls=False)
    # test_bench_flows("MachSuite-md-knn-D", True, True, useHls=False)
    # test_bench_flows("MachSuite-nw-D", True, True, useHls=False)
    # test_bench_flows("MachSuite-spmv-crs-D", True, True, useHls=False)
    # test_bench_flows("MachSuite-spmv-ellpack-D", True, True, useHls=False)
    # test_bench_flows("MachSuite-stencil-2d-D", True, True, useHls=False)
    # test_bench_flows("MachSuite-stencil-3d-D", True, True, useHls=False)
    # test_bench_flows("MachSuite-viterbi-D", True, True, useHls=False)
    pass


"""
TODO:
- Improve R/W and Uninitialized detection

- New metrics:
* critical path stuff (number of tasks in subgraph, critical path length, and parallelism metric)
* parallel sets, T2 -> {T3, T4}
"""

if __name__ == "__main__":
    main()
