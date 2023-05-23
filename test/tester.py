import json
import os
from string import Template
from benchmarks import benchmarks, givenApps
from clava_config import ClavaConfig


CODE_DIR = "../test/output_code/"
STAT_DIR = "../test/output_stats/"
INPUT_DIR = "../test/inputs/"
TEMP_FOLDER = "../test/temp/"
CONFIG = TEMP_FOLDER + "config.json"


def get_default_args():
    cfg = ClavaConfig()
    cfg.set_check_syntax()
    cfg.set_clean_intermediate_files()
    cfg.set_copy_files_in_sources()
    cfg.set_custom_resources()
    cfg.set_parallel_parsing()
    cfg.set_parse_includes()
    cfg.set_show_stack()
    cfg.set_verbosity(0)
    return cfg.build_command()


def prepare_command_and_file_given(appName):
    flags = get_default_args()
    inputPath, outputPath, standard, config = givenApps[appName]
    inputPath = INPUT_DIR + inputPath
    outputPath = CODE_DIR + outputPath

    config["appName"] = appName
    config["codeOutputDir"] = outputPath
    config["statsOutputDir"] = STAT_DIR + appName
    config["inputType"] = "givenApp"

    if not os.path.exists(TEMP_FOLDER):
        os.makedirs(TEMP_FOLDER)
    with open(CONFIG, "w+") as f:
        json.dump(config, f, indent=4)

    command = Template(
        "clava ../test/TestEntrypoint.js $flags -std $standard -p $input -of $output")
    res = command.substitute(
        flags=flags, input=inputPath, output=outputPath, standard=standard)
    return res


def prepare_command_and_file_bench(appName):
    flags = get_default_args()

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

    command = Template(
        "clava ../test/TestEntrypoint.js $flags -std $standard -of $output -dep $dependency")
    res = command.substitute(
        flags=flags, output=CODE_DIR, standard=standard, dependency=dep)
    return res


def exec_clava(cmd):
    output = Template("Running Clava with the following command:\n\t$cmd\n")
    print(output.substitute(cmd=cmd))
    ret = os.system(cmd)


def dispatch_given(appName):
    print('-' * 30 + " Running " + appName + " " + '-' * 30)
    cmd = prepare_command_and_file_given(appName)
    print(cmd)
    exec_clava(cmd)
    print('-' * 80)


def dispatch_bench(appName):
    print('-' * 30 + " Running " + appName + " " + '-' * 30)
    cmd = prepare_command_and_file_bench(appName)
    exec_clava(cmd)
    print('-' * 80)


def ensure_temp_exists():
    if not os.path.exists("../test/temp"):
        os.mkdir("../test/temp")


def main():
    os.chdir('src')
    # run_apps()
    run_benchmarks()


def run_apps():
    # dispatch_given("scenarioA")
    dispatch_given("scenarioB")
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
