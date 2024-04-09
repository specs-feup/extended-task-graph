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
        # Applications
        # -------------------
        # "edgedetect",  # OK
        # "stresstest",
        # "scenarioA",
        # "scenarioB",
        # "trivial",
        # "HiFlipVX-v2-N",
        # -------------------
        # AxBench
        # -------------------
        # "AxBench-blackscholes-N",
        # "AxBench-fft-N",
        # "AxBench-inversek2j-N",
        # "AxBench-jmeint-N",
        # "AxBench-jpeg-N",
        # "AxBench-kmeans-N",
        # "AxBench-sobel-N",
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
        # -------------------
        # CortexSuite
        # -------------------
        # "CortexSuite-cortex-clustering-kmeans-N",
        # "CortexSuite-cortex-clustering-spectral-N",
        # "CortexSuite-cortex-cnn-N",
        # "CortexSuite-cortex-lda-N",
        # "CortexSuite-cortex-liblinear-N",  # no call graph gen
        # "CortexSuite-cortex-motion-estimation-N",
        # "CortexSuite-cortex-rbm-N",
        "CortexSuite-cortex-sphinx-N",  # fail
        # "CortexSuite-cortex-srr-N",
        # "CortexSuite-cortex-svd3-N",
        # "CortexSuite-cortex-word2vec-compute-accuracy-N",
        # "CortexSuite-cortex-word2vec-distance-N",
        # "CortexSuite-cortex-word2vec-word2phrase-N",
        # "CortexSuite-cortex-word2vec-word2vec-N",
        # "CortexSuite-cortex-word2vec-word-analogy-N",
        "CortexSuite-vision-disparity-N",
        # "CortexSuite-vision-localization-N",
        # "CortexSuite-vision-mser-N",
        # "CortexSuite-vision-multi-ncut-N",
        # "CortexSuite-vision-pca-N",
        # "CortexSuite-vision-sift-N",
        # "CortexSuite-vision-stitch-N",
        # "CortexSuite-vision-svm-N",
        # "CortexSuite-vision-texture-synthesis-N",
        # "CortexSuite-vision-tracking-N",
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
        # "Rodinia-pathfinder-N",
        # "Rodinia-srad-v1-N",
        # "Rodinia-srad-v2-N",
        # "Rodinia-streamcluster-N",
        # -------------------
        # Rosetta
        # -------------------
        # "Rosetta-3d-rendering-N",  # OK
        # "Rosetta-digit-recognition-N",  # OK
        # "Rosetta-face-detection-N",  # OK
        # "Rosetta-optical-flow-current",  # OK
        # "Rosetta-spam-filter-N",  # OK
    ]

    cnt = 0
    for bench_name in bench_names:
        if bench_name in benchmarks:
            bench_props = benchmarks[bench_name]

            bench_props["skipTransforms"] = False
            bench_props["skipTaskGraph"] = False

            # bench_props["skipTransforms"] = True
            # bench_props["skipTaskGraph"] = True

            test_bench(bench_name, bench_props)
            cnt += 1

    print("-------------------------------")
    print(f"Finished testing {cnt} benchmarks")
    print("-------------------------------")


if __name__ == "__main__":
    main()
