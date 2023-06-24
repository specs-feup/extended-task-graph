import os
import json
import shutil
from string import Template
from benchmarks import benchmarks, apps
from clava import Clava


ENTRYPOINT = "../test/TestEntrypoint.js"
OUTPUT_DIR = "../test/outputs/"
INPUT_DIR = "../test/inputs/"
TEMP_FOLDER = "../test/temp/"
CONFIG = TEMP_FOLDER + "config.json"
EXTRA_INCLUDES = [
    os.path.abspath(
        os.path.join("..", "Experiments", "Clava", "FunctionVoidifier", "src")
    ),
    os.path.abspath(
        os.path.join("..", "Experiments", "Clava", "FunctionOutliner", "src")
    ),
    os.path.abspath(
        os.path.join("..", "Experiments", "Clava", "ArrayFlattener", "src")
    ),
    os.path.abspath(
        os.path.join("..", "Experiments", "Clava", "ConstantPropagator", "src")
    ),
    os.path.abspath(os.path.join("..", "Experiments", "Clava", "SwitchToIf", "src")),
]


def create_estim_folder(appName):
    estim_path = "../test/outputs/" + appName + "/estim_cpu"
    if not os.path.exists(estim_path):
        os.makedirs(estim_path)
    profiler = "../tools/profiler/profiler.sh"
    shutil.copy(profiler, estim_path)


def ensure_temp_exists():
    if not os.path.exists("../test/temp"):
        os.mkdir("../test/temp")


def set_default_args(clava):
    # clava.set_no_clava_info()
    clava.set_clean_intermediate_files()
    clava.set_copy_files_in_sources()
    clava.set_allow_custom_resources()
    clava.set_custom_resources()
    clava.set_parallel_parsing()
    clava.set_parse_includes()
    clava.set_show_stack()
    clava.set_no_code_generation()
    clava.set_verbosity(0)
    clava.set_extra_includes_folder(EXTRA_INCLUDES)


def prepare_command_and_file_app(appName, flow):
    standard, config = apps[appName]
    inputPath = INPUT_DIR + appName
    outputPath = OUTPUT_DIR + appName

    # UPT config
    config["appName"] = appName
    config["outputDir"] = outputPath

    if not os.path.exists(TEMP_FOLDER):
        os.makedirs(TEMP_FOLDER)
    with open(CONFIG, "w+") as f:
        json.dump(config, f, indent=4)

    # Clava command line arguments
    clava = Clava(ENTRYPOINT)
    set_default_args(clava)
    clava.set_standard(standard)
    clava.set_workspace(inputPath)
    clava.set_output_folder_name(outputPath)
    clava.set_args({"inputType": "app", "flow": flow})

    return clava


def prepare_command_and_file_bench(appName, flow):
    standard, config = benchmarks[appName]
    suite = appName.split("-")[0]
    dep = "https://github.com/specs-feup/clava-benchmarks.git?folder=" + suite
    output_path = OUTPUT_DIR + appName

    # UPT config
    config["appName"] = appName
    config["outputDir"] = output_path

    if not os.path.exists(TEMP_FOLDER):
        os.makedirs(TEMP_FOLDER)
    with open(CONFIG, "w+") as f:
        json.dump(config, f, indent=4)

    clava = Clava(ENTRYPOINT)
    set_default_args(clava)
    clava.set_standard(standard)
    clava.set_flat_output_folder()
    clava.set_output_folder_name(OUTPUT_DIR)
    clava.set_dependencies(dep)
    clava.set_args({"inputType": "bench", "flow": flow})
    return clava


def dispatch_flow_code(appName, isBenchmark):
    print("-" * 15 + " Running code flow for  " + appName + " " + "-" * 15)
    if isBenchmark:
        clava = prepare_command_and_file_bench(appName, "code")
    else:
        clava = prepare_command_and_file_app(appName, "code")

    commands = clava.get_current_command()
    info = Template("Running Clava with the following command:\n\t$cmd\n")
    print(info.substitute(cmd=commands))

    res = clava.run()
    dashes = "-" * 34
    print(dashes + " (code = " + str(res) + ") " + dashes)


def dispatch_flow_holistic(appName, isBenchmark):
    pass


def dispatch_bench(appName):
    dispatch(appName, True)


def dispatch_app(appName):
    dispatch(appName, False)


def dispatch(appName, isBenchmark):
    # -----------------------------------
    # Flow code
    # -----------------------------------
    dispatch_flow_code(appName, isBenchmark)

    # -----------------------------------
    # Inter-flow stage: get profiling info
    # -----------------------------------
    create_estim_folder(appName)

    # -----------------------------------
    # Flow Holistic
    # -----------------------------------
    dispatch_flow_holistic(appName, isBenchmark)


def main():
    os.chdir("src")

    dispatch_app("edgedetect")
    # dispatch_app("scenarioA")
    # dispatch_app("scenarioB")

    ### CHStone
    # dispatch_bench("CHStone-aes-N")
    # dispatch_bench("CHStone-blowfish-N")
    # dispatch_bench("CHStone-dfdiv-N")
    # dispatch_bench("CHStone-dfmul-N")
    # dispatch_bench("CHStone-gsm-N")
    # dispatch_bench("CHStone-mips-N")
    # dispatch_bench("CHStone-sha-N")
    # dispatch_bench("CHStone-motion-N")
    # dispatch_bench("CHStone-dfadd-N")
    # -----------------------------------
    # dispatch_bench("CHStone-adpcm-N")   # abs issue
    # dispatch_bench("CHStone-dfsin-N")  # label issue
    # dispatch_bench("CHStone-jpeg-N")  # bunch of issues

    ### HiFlipVX
    # dispatch_bench("HiFlipVX-v2-N")

    ### Rosetta
    # dispatch_bench("Rosetta-3d-rendering-N")
    # dispatch_bench("Rosetta-digit-recognition-N")
    # dispatch_bench("Rosetta-face-detection-N")
    # dispatch_bench("Rosetta-optical-flow-current")
    # dispatch_bench("Rosetta-optical-flow-sintel")
    # dispatch_bench("Rosetta-spam-filter-N")


if __name__ == "__main__":
    main()
