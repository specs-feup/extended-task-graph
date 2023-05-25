import json
import os
from string import Template
from benchmarks import benchmarks, apps
from clava import Clava


ENTRYPOINT = "../test/TestEntrypoint.js"
CODE_DIR = "../test/output_code/"
STAT_DIR = "../test/output_stats/"
INPUT_DIR = "../test/inputs/"
TEMP_FOLDER = "../test/temp/"
CONFIG = TEMP_FOLDER + "config.json"
EXTRA_INCLUDES = [
    "C:\\Users\\Tiago\\Dev\\Experiments\\ClavaFunctionOutliner\\src"]


def set_default_args(clava):
    clava.set_check_syntax()
    clava.set_clean_intermediate_files()
    clava.set_copy_files_in_sources()
    clava.set_custom_resources()
    clava.set_parallel_parsing()
    clava.set_parse_includes()
    clava.set_show_stack()
    clava.set_verbosity(0)
    clava.set_includes_folder(EXTRA_INCLUDES)


def prepare_command_and_file_app(appName):
    inputPath, outputPath, standard, config = apps[appName]
    inputPath = INPUT_DIR + inputPath
    outputPath = CODE_DIR + outputPath

    config["appName"] = appName
    config["codeOutputDir"] = outputPath
    config["statsOutputDir"] = STAT_DIR + appName
    config["inputType"] = "app"

    if not os.path.exists(TEMP_FOLDER):
        os.makedirs(TEMP_FOLDER)
    with open(CONFIG, "w+") as f:
        json.dump(config, f, indent=4)

    clava = Clava(ENTRYPOINT)
    set_default_args(clava)
    clava.set_standard(standard)
    clava.set_workspace(inputPath)
    clava.set_output_folder_name(outputPath)

    return clava


def prepare_command_and_file_bench(appName):
    canonicalName, inputSize, suite, standard, config = benchmarks[appName]
    dep = "https://github.com/specs-feup/clava-benchmarks.git?folder=" + suite

    config["appName"] = canonicalName
    config["codeOutputDir"] = CODE_DIR + "/" + suite
    config["statsOutputDir"] = STAT_DIR + "/" + suite
    config["inputType"] = "benchmark"
    config["suite"] = suite
    config["inputSize"] = inputSize

    if not os.path.exists(TEMP_FOLDER):
        os.makedirs(TEMP_FOLDER)
    with open(CONFIG, "w+") as f:
        json.dump(config, f, indent=4)

    clava = Clava(ENTRYPOINT)
    set_default_args(clava)
    clava.set_standard(standard)
    clava.set_output_folder_name(CODE_DIR)
    clava.set_dependencies(dep)
    return clava


def dispatch_bench(appName):
    dispatch(appName, True)


def dispatch_app(appName):
    dispatch(appName, False)


def dispatch(appName, isBenchmark):
    print('-' * 30 + " Running " + appName + " " + '-' * 30)
    if isBenchmark:
        clava = prepare_command_and_file_bench(appName)
    else:
        clava = prepare_command_and_file_app(appName)

    cmd = clava.get_current_command()
    info = Template("Running Clava with the following command:\n\t$cmd\n")
    print(info.substitute(cmd=cmd))

    res = clava.run()
    dashes = '-' * 34
    print(dashes + " (code = " + str(res) + ") " + dashes)


def ensure_temp_exists():
    if not os.path.exists("../test/temp"):
        os.mkdir("../test/temp")


def main():
    os.chdir('src')
    # run_apps()
    run_benchmarks()


def run_apps():
    dispatch_app("scenarioA")
    # dispatch_app("scenarioB")
    pass


def run_benchmarks():
    run_chstone()
    # run_rosetta()
    # run_hiflipvx()


def run_chstone():
    dispatch_bench("CHStone-aes")
    '''
    dispatch_bench("CHStone-adpcm")
    dispatch_bench("CHStone-blowfish")
    dispatch_bench("CHStone-dfadd")
    dispatch_bench("CHStone-dfdiv")
    dispatch_bench("CHStone-dfmul")
    dispatch_bench("CHStone-dfsin")
    dispatch_bench("CHStone-gsm")
    dispatch_bench("CHStone-jpeg")
    dispatch_bench("CHStone-mips")
    dispatch_bench("CHStone-motion")
    dispatch_bench("CHStone-sha")
    '''


def run_rosetta():
    dispatch_bench("Rosetta-3drendering")
    dispatch_bench("Rosetta-digitrecog")
    dispatch_bench("Rosetta-facedetect")
    # dispatch_bench("Rosetta-opticalflow-curr")
    # dispatch_bench("Rosetta-opticalflow-sintel")
    dispatch_bench("Rosetta-spamfilter")


def run_hiflipvx():
    dispatch_bench("HiFlipVX")


if __name__ == "__main__":
    main()