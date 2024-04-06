import json
import glob
from tester import test_bench


def main():
    json_files = glob.glob("test/benchmarks/*.json")

    json_data = []
    for file in json_files:
        with open(file, "r") as file:
            data = json.load(file)
            json_data.append(data)

    benchmarks = {}
    for d in json_data:
        benchmarks.update(d)

    bench_names = [
        # -------------------
        # Custom apps
        # -------------------
        "edgedetect",  # OK
        "stresstest",
        # "scenarioA",
        # "scenarioB",
        # "trivial",
        # "HiFlipVX-v2-N",
        # -------------------
        # Rosetta
        # -------------------
        "Rosetta-3d-rendering-N",  # OK
        "Rosetta-digit-recognition-N",  # OK
        "Rosetta-face-detection-N",  # OK
        "Rosetta-optical-flow-current",  # OK
        "Rosetta-spam-filter-N",  # OK
        # -------------------
        # MachSuite
        # -------------------
        "MachSuite-aes-D",  # FAIL
        "MachSuite-backprop-D",  # OK
        "MachSuite-fft-transpose-D",  # OK
        "MachSuite-kmp-D",  # OK
        "MachSuite-sort-merge-D",  # OK
        "MachSuite-sort-radix-D",  # OK
        # -------------------
        # Rodinia
        # -------------------
        "Rodinia-backprop-N",
        "Rodinia-bfs-N",
        "Rodinia-b+tree-N",
        "Rodinia-cfd-euler3d-N",
        "Rodinia-cfd-euler3d-double-N",
        "Rodinia-cfd-pre-euler3d-N",
        "Rodinia-cfd-pre-euler3d-double-N",
        "Rodinia-heartwall-N",
        "Rodinia-hotspot-N",
        "Rodinia-hotspot3D-N",
        "Rodinia-kmeans-N",
        "Rodinia-lavaMD-N",
        "Rodinia-leukocyte-N",
        "Rodinia-lud-N",
        "Rodinia-myocyte-N",
        "Rodinia-nn-N",
        "Rodinia-nw-N",
        "Rodinia-particlefilter-N",
        "Rodinia-pathfinder-N",
        "Rodinia-srad-v1-N",
        "Rodinia-srad-v2-N",
        "Rodinia-streamcluster-N",
        # -------------------
        # CortexSuite
        # -------------------
        "CortexSuite-vision-disparity-N",
        "CortexSuite-vision-localization-N",
        "CortexSuite-vision-mser-N",
        "CortexSuite-vision-multi-ncut-N",
        "CortexSuite-vision-pca-N",
        "CortexSuite-vision-sift-N",
        "CortexSuite-vision-stitch-N",
        "CortexSuite-vision-svm-N",
        "CortexSuite-vision-texture-synthesis-N",
        "CortexSuite-vision-tracking-N",
        # -------------------
        # CHStone
        # -------------------
        "CHStone-aes-N",
        "CHStone-blowfish-N",
        "CHStone-dfdiv-N",
        "CHStone-dfmul-N",
        "CHStone-gsm-N",
        "CHStone-mips-N",
        "CHStone-sha-N",
        "CHStone-motion-N",
        "CHStone-dfadd-N",
        "CHStone-adpcm-N",
        "CHStone-dfsin-N",
        "CHStone-jpeg-N",
    ]

    cnt = 0
    for bench_name in bench_names:
        if bench_name in benchmarks:
            bench_props = benchmarks[bench_name]

            bench_props["skipTransforms"] = True
            bench_props["skipTaskGraph"] = True

            test_bench(bench_name, bench_props)
            cnt += 1

    print("-------------------------------")
    print(f"Finished testing {cnt} benchmarks")
    print("-------------------------------")


if __name__ == "__main__":
    main()
