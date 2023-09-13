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
    os.path.abspath(os.path.join("..", "clava-code-transformations", "src")),
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
    outputPath = OUTPUT_DIR + appName
    inputPath = ""
    if flow == "code":
        inputPath = INPUT_DIR + appName
    if flow == "holistic":
        inputPath = outputPath + "/src_inter_tasks"

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
    clava.set_args({"inputType": "bench", "flow": flow})

    if flow == "code":
        dep = "https://github.com/specs-feup/clava-benchmarks.git?folder=" + suite
        clava.set_dependencies(dep)
    if flow == "holistic":
        inputPath = output_path + "/src_inter_tasks"
        clava.set_workspace(inputPath)

    return clava


def test_flow(appName, isBenchmark, flow):
    print("-" * 15 + " Running " + flow + " flow for  " + appName + " " + "-" * 15)
    if isBenchmark:
        clava = prepare_command_and_file_bench(appName, flow)
    else:
        clava = prepare_command_and_file_app(appName, flow)

    commands = clava.get_current_command()
    info = Template("Running Clava with the following command:\n\t$cmd\n")
    print(info.substitute(cmd=commands))

    res = clava.run()
    dashes = "-" * 34
    print(dashes + " (code = " + str(res) + ") " + dashes)

    if flow == "holistic":
        output_path = OUTPUT_DIR + appName
        dot1 = f"{output_path}/taskgraph/{appName}_taskgraph.dot"
        dot2 = f"{output_path}/taskgraph/{appName}_taskgraph_min.dot"
        generate_image_from_dot(dot1)
        generate_image_from_dot(dot2)


def generate_image_from_dot(dot):
    if not os.path.exists(dot):
        return

    png = dot.replace(".dot", ".png")
    cmd = f"dot -Tpng {dot} -o {png} -Gmemory=2GB"
    os.system(cmd)


def test_bench_flows(appName, flowCode, flowHolistic):
    test_flows(appName, True, flowCode, flowHolistic)


def test_app_flows(appName, flowCode, flowHolistic):
    test_flows(appName, False, flowCode, flowHolistic)


def test_flows(appName, isBenchmark, flowCode, flowHolistic):
    # -----------------------------------
    # Flow code
    # -----------------------------------
    if flowCode:
        test_flow(appName, isBenchmark, "code")

    # -----------------------------------
    # Inter-flow stage: get profiling info
    # -----------------------------------
    create_estim_folder(appName)

    # -----------------------------------
    # Flow Holistic
    # -----------------------------------
    if flowHolistic:
        test_flow(appName, isBenchmark, "holistic")
