import os
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

    os.chdir("src")
    with open("../test/benchmarks.json", "r") as f:
        benchmarks = json.load(f)

    bench_names = [
        # -------------------
        # Custom apps
        # -------------------
        # "edgedetect",
        # "stresstest",
        # "scenarioA",
        # "scenarioB",
        "trivial",
        # -------------------
        # Rosetta
        # -------------------
        # "Rosetta-3d-rendering-N",
        # "Rosetta-digit-recognition-N",
        # "Rosetta-face-detection-N",
        # "Rosetta-optical-flow-current",
        # "Rosetta-spam-filter-N",
        # -------------------
        # MachSuite
        # -------------------
        # "MachSuite-aes-D",
        # "MachSuite-backprop-D",
        # "MachSuite-fft-transpose-D",
        # "MachSuite-kmp-D",
        # "MachSuite-sort-merge-D",
        # "MachSuite-sort-radix-D",
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

    print("Finished testing {} benchmarks".format(cnt))


if __name__ == "__main__":
    main()
