import json
import os
from string import Template
from benchmarks import benchmarks, givenApps


CODE_DIR = "../test/output_code/"
STAT_DIR = "../test/output_stats/"
INPUT_DIR = "../test/inputs/"
CONFIG = "../test/temp/config.json"
DEFAULT_ARGS = "-pi -par -cr -cl -cs -s -cfs -b 0"


def prepare_command_and_file_given(appName):
    inputPath, outputPath, standard, config = givenApps[appName]
    inputPath = INPUT_DIR + inputPath
    outputPath = CODE_DIR + outputPath

    config["appName"] = appName
    config["codeOutputDir"] = outputPath
    config["statsOutputDir"] = STAT_DIR + appName
    # to be removed once we figure out how to pass args to JS
    config["inputType"] = "givenApp"

    with open(CONFIG, "w+") as f:
        json.dump(config, f, indent=4)

    command = Template(
        "clava ../test/TestEntrypoint.js $args -std $standard -p $input -of $output")
    res = command.substitute(
        args=DEFAULT_ARGS, input=inputPath, output=outputPath, standard=standard)
    return res


def prepare_command_and_file_bench(appName):
    canonicalName, inputSize, importPath, standard, config = benchmarks[appName]

    depSuffix = importPath.split(".")[2]
    depSuffix = depSuffix[:-len("BenchmarkSet")]
    dep = "https://github.com/specs-feup/clava-benchmarks.git?folder=" + depSuffix

    config["appName"] = canonicalName
    config["codeOutputDir"] = CODE_DIR
    config["statsOutputDir"] = STAT_DIR
    # to be removed once we figure out how to pass args to JS
    config["inputType"] = "benchmark"
    config["importPath"] = importPath
    config["inputSize"] = inputSize

    with open(CONFIG, "w+") as f:
        json.dump(config, f, indent=4)

    command = Template(
        "clava ../test/TestEntrypoint.js $args -std $standard -of $output -dep $dependency")
    res = command.substitute(
        args=DEFAULT_ARGS, output=CODE_DIR, standard=standard, dependency=dep)
    return res


def exec_clava(cmd):
    ret = os.system(cmd)


def dispatch_given(appName):
    print('-' * 30 + " Running " + appName + " " + '-' * 30)
    cmd = prepare_command_and_file_given(appName)
    exec_clava(cmd)
    print('-' * 80)


def dispatch_bench(appName):
    print('-' * 30 + " Running " + appName + " " + '-' * 30)
    cmd = prepare_command_and_file_bench(appName)
    exec_clava(cmd)
    print('-' * 80)


def main():
    os.chdir('src')
    run_apps()
    run_benchmarks()


def run_apps():
    # dispatch_given("scenarioA")
    # dispatch_given("scenarioB")
    pass


def run_benchmarks():
    # run_chstone()
    run_rosetta()


def run_chstone():
    dispatch_bench("CHStone-aes")
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


def run_rosetta():
    dispatch_bench("Rosetta-3drendering")
    # dispatch_bench("Rosetta-digitrecog")
    # dispatch_bench("Rosetta-facedetect")
    # dispatch_bench("Rosetta-opticalflow-curr")
    # dispatch_bench("Rosetta-opticalflow-sintel")
    # dispatch_bench("Rosetta-spamfilter")


if __name__ == "__main__":
    main()
