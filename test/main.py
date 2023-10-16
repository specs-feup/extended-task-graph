import os
from tester import test_app_flows, test_bench_flows


def main():
    os.chdir("src")

    test_app_flows("edgedetect", False, True, useHls=False)
    # test_app_flows("stresstest", True, True, useHls=True)
    # test_app_flows("scenarioA", True, True, useHls=True)
    # test_app_flows("scenarioB", True, True, useHls=True)

    ### CHStone
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
    # test_bench_flows("CHStone-adpcm-N", True, True)   # abs issue
    # test_bench_flows("CHStone-dfsin-N", True, True)  # label issue
    # test_bench_flows("CHStone-jpeg-N", True, True)  # bunch of issues

    ### HiFlipVX
    # test_bench_flows("HiFlipVX-v2-N", True, True)

    ### Rosetta
    test_bench_flows("Rosetta-3d-rendering-N", True, True, useHls=False)
    #test_bench_flows("Rosetta-digit-recognition-N", True, True, useHls=True)
    #test_bench_flows("Rosetta-face-detection-N", True, True, useHls=True)
    #test_bench_flows("Rosetta-optical-flow-current", True, True, useHls=True)
    #test_bench_flows("Rosetta-spam-filter-N", True, True, useHls=True)

    # test_bench_flows("Rosetta-optical-flow-sintel", False, True, useHls=True)

    """
    TODO:
    - Improve R/W and Uninitialized detection
    - Implement the other metrics
    - rendering_sw.cpp:195:7: warning: expression result unused [-Wunused-value]
      *i++;
      ^~~~
      I think this may need some parenthesis or even an expansion to *i = *i + 1
    """


if __name__ == "__main__":
    main()
