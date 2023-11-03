import os
import json
import shutil
from string import Template
from collections.abc import Iterable
from benchmarks import benchmarks, apps
from clava import Clava


ENTRYPOINT = "../test/TestEntrypoint.js"
OUTPUT_DIR = "../test/outputs/"
INPUT_DIR = "../test/inputs/"
TEMP_FOLDER = "../test/temp/"
CONFIG = TEMP_FOLDER + "config.json"
EXTRA_INCLUDES = [
    os.path.abspath(os.path.join("..", "clava-code-transformations", "src")),
    os.path.abspath(os.path.join("..", "clava-benchmarks", "MachSuite")),
]


def create_estim_folder(appName):
    estim_path = "../test/outputs/" + appName + "/cpu_profiling"
    if not os.path.exists(estim_path):
        os.makedirs(estim_path)
    profiler = "../tools/profiler/profiler.sh"
    shutil.copy(profiler, estim_path)
    agg = "../tools/profiler/csv_to_json.py"
    shutil.copy(agg, estim_path)


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


def prepare_command_and_file_app(appName, flow, useHls=False):
    standard, config = apps[appName]
    outputPath = OUTPUT_DIR + appName
    inputPath = ""
    if flow == "code":
        inputPath = INPUT_DIR + appName
    if flow == "holistic":
        inputPath = outputPath + "/src_tasks"

    # UPT config
    config["appName"] = appName
    config["outputDir"] = outputPath
    config["useHls"] = useHls
    config["cpuEstim"] = outputPath + "/estimations/" + config["cpuEstim"]
    config["fpgaEstim"] = outputPath + "/estimations/" + config["fpgaEstim"]

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


def prepare_command_and_file_bench(appName, flow, useHls=False):
    standard, config = benchmarks[appName]
    suite = appName.split("-")[0]
    output_path = OUTPUT_DIR + appName

    # UPT config
    config["appName"] = appName
    config["outputDir"] = output_path
    config["useHls"] = useHls
    config["cpuEstim"] = output_path + "/estimations/" + config["cpuEstim"]
    config["fpgaEstim"] = output_path + "/estimations/" + config["fpgaEstim"]

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
        #dep = "https://github.com/specs-feup/clava-benchmarks.git?folder=" + suite
        #clava.set_dependencies(dep)
        pass
    if flow == "holistic":
        inputPath = output_path + "/src_tasks"
        clava.set_workspace(inputPath)

    return clava


def test_flow(appName, isBenchmark, flow, useHls=False):
    print("-" * 15 + " Running " + flow + " flow for  " + appName + " " + "-" * 15)
    if isBenchmark:
        clava = prepare_command_and_file_bench(appName, flow, useHls)
    else:
        clava = prepare_command_and_file_app(appName, flow, useHls)

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
        dot3 = f"{output_path}/estimations/{appName}_taskgraph_annotated.dot"
        dot4 = f"{output_path}/app_stats_original/{appName}_callgraph.dot"
        dot5 = f"{output_path}/app_stats_tasks/{appName}_callgraph.dot"

        generate_image_from_dot([dot1, dot2, dot3, dot4, dot5])


def generate_image_from_dot(dotfiles):
    if not isinstance(dotfiles, Iterable):
        dotfiles = [dotfiles]

    for dot in dotfiles:
        if not os.path.exists(dot):
            continue

        png = dot.replace(".dot", ".png")
        cmd = f"dot -Tpng {dot} -o {png} -Gmemory=2GB"

        print(f"Generating image from {dot}...", end="")
        os.system(cmd)
        print(f"Done!")


def test_bench_flows(appName, flowCode, flowHolistic, useHls=False):
    test_flows(appName, True, flowCode, flowHolistic, useHls)


def test_app_flows(appName, flowCode, flowHolistic, useHls=False):
    test_flows(appName, False, flowCode, flowHolistic, useHls)


def test_flows(appName, isBenchmark, flowCode, flowHolistic, useHls=False):
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
        test_flow(appName, isBenchmark, "holistic", useHls)
