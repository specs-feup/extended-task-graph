import json
import os
from string import Template


CODE_DIR = "../test/output_code/"
STAT_DIR = "../test/output_stat/"
INPUT_DIR = "../test/inputs/"
CONFIG = "../test/temp/config.json"
DEFAULT_ARGS = "-pi -par -cr -cl -cs -s -cfs -b 0"

# appName: (inputName, outputName, standard, toolConfig)
givenApps = {
    "scenarioA": ("scenarioA", ".", "c11", {"clock": 10}),
    "scenarioB": ("scenarioB", ".", "c11", {"clock": 10})
}

benchmarks = {
    "CHStone-aes": ()
}


def prepare_command_and_file_given(appName):
    inputPath, outputPath, standard, config = givenApps[appName]
    inputPath = INPUT_DIR + inputPath
    outputPath = CODE_DIR + outputPath

    config["codeOutputDir"] = outputPath
    config["statsOutputDir"] = STAT_DIR + appName
    config["appName"] = appName
    # to be removed once we figure out how to pass args to JS
    config["inputType"] = "givenApp"

    with open(CONFIG, "w") as f:
        json.dump(config, f, indent=4)

    command = Template(
        "clava ../test/TestEntrypoint.js $args -std $standard -p $input -of $output")
    res = command.substitute(
        args=DEFAULT_ARGS, input=inputPath, output=outputPath, standard=standard)
    return res


def exec_clava(cmd):
    ret = os.system(cmd)
    #print("ret: ", ret)


def dispatch_given(appName):
    print('-' * 30 + " Running " + appName + " " + '-' * 30)
    cmd = prepare_command_and_file_given(appName)
    exec_clava(cmd)
    print('-' * 80)


def main():
    os.chdir('src')

    dispatch_given("scenarioA")
    dispatch_given("scenarioB")

    return


if __name__ == "__main__":
    main()
