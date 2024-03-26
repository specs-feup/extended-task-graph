import json
from tester import test_bench


def main():
    """
    TODO:
    - Improve R/W and Uninitialized detection
    - rendering_sw.cpp:195:7: warning: expression result unused [-Wunused-value]
        *i++;
        ^~~~
        I think this may need some parenthesis or even an expansion to *i = *i + 1
        Similar issue is observed in fft-transpose

    - New metrics:
    * parallel sets, T2 -> {T3, T4}"""

    # os.chdir("src")
    with open("test/benchmarks.json", "r") as f:
        benchmarks = json.load(f)

    bench_names = [
        # -------------------
        # Custom apps
        # -------------------
        # "edgedetect",  # OK
        # "stresstest",
        # "scenarioA",
        # "scenarioB",
        # "trivial",
        # -------------------
        # Rosetta
        # -------------------
        # "Rosetta-3d-rendering-N",  # OK
        # "Rosetta-digit-recognition-N",  # OK
        # "Rosetta-face-detection-N",  # OK
        # "Rosetta-optical-flow-current",  # OK
        # "Rosetta-spam-filter-N",  # OK
        # -------------------
        # MachSuite
        # -------------------
        # "MachSuite-aes-D",  # FAIL
        # "MachSuite-backprop-D",  # OK
        # "MachSuite-fft-transpose-D",  # OK
        # "MachSuite-kmp-D",  # OK
        # "MachSuite-sort-merge-D",  # OK
        # "MachSuite-sort-radix-D",  # OK
        # -------------------
        # Rodinia
        # -------------------
        # "Rodinia-backprop-N",
        # "Rodinia-bfs-N",
        # "Rodinia-b+tree-N",
        # "Rodinia-cfd-euler3d-N",
        # "Rodinia-cfd-euler3d-double-N",
        # "Rodinia-cfd-pre-euler3d-N",
        # "Rodinia-cfd-pre-euler3d-double-N",
        # "Rodinia-heartwall-N",
        # "Rodinia-hotspot-N",
        # "Rodinia-hotspot3D-N",
        # "Rodinia-kmeans-N",
        # "Rodinia-lavaMD-N",
        # "Rodinia-leukocyte-N",
        # "Rodinia-lud-N",
        # "Rodinia-myocyte-N",
        # "Rodinia-nn-N",
        # "Rodinia-nw-N",
        # "Rodinia-particlefilter-N",
        "Rodinia-pathfinder-N",
        # "Rodinia-srad-v1-N",
        # "Rodinia-srad-v2-N",
        # "Rodinia-streamcluster-N",
        # -------------------
        # HiFlipVX
        # -------------------
        # "HiFlipVX-v2-N",
        # -------------------
        # CHStone
        # -------------------
        # "CHStone-aes-N",
        # "CHStone-blowfish-N",
        # "CHStone-dfdiv-N",
        # "CHStone-dfmul-N",
        # "CHStone-gsm-N",
        # "CHStone-mips-N",
        # "CHStone-sha-N",
        # "CHStone-motion-N",
        # "CHStone-dfadd-N",
        # "CHStone-adpcm-N",
        # "CHStone-dfsin-N",
        # "CHStone-jpeg-N",
    ]

    cnt = 0
    for bench_name in bench_names:
        if bench_name in benchmarks:
            bench_props = benchmarks[bench_name]
            test_bench(bench_name, bench_props)
            cnt += 1

    print("-------------------------------")
    print(f"Finished testing {cnt} benchmarks")
    print("-------------------------------")


if __name__ == "__main__":
    main()
