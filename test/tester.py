import os
import json
from clava import Clava

ENTRYPOINT = "../test/TestEntrypoint.js"
OUTPUT_DIR = "../test/outputs/"
INPUT_DIR = "../test/inputs/"
TEMP_FOLDER = "../test/temp/"
CONFIG = TEMP_FOLDER + "config.json"
EXTRA_INCLUDES = [
    os.path.abspath(os.path.join("..", "clava-code-transformations", "src")),
    os.path.abspath(os.path.join("..", "clava-vitis-integration", "src")),
    os.path.abspath(os.path.join("..", "clava-benchmarks", "MachSuite")),
    os.path.abspath(os.path.join("..", "clava-benchmarks", "Rosetta")),
]


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

    # clava.set_clang_flag("-nostdlibinc")
    # clava.set_clang_flag("-nobuiltininc")
    # clava.set_clang_flag("-nobuiltininc -nostdlibinc")
    # clava.set_libc_system_libs()
    # clava.set_libc_clava_builtins()
    clava.set_libc_clava_plus()


def generate_image_from_dot(dot):
    if not os.path.exists(dot):
        print(f"Dotfile {dot} not found! Aborting PNG generation...")
        return

    png = dot.replace(".dot", ".png")
    cmd = f"dot -Tpng {dot} -o {png} -Gmemory=2GB"

    print(f"Generating image from {dot}...", end="")
    os.system(cmd)
    print(f"Done!")


def test_bench(name, config):
    # Add output folder to the config
    # On a real-world scenario, this would already be part of it
    # But for testing purposes, we generate it dynamically
    out_folder = OUTPUT_DIR + name
    config["outputDir"] = out_folder

    # And the same thing for the appName:
    # Normally, this would be part of the config
    # But since we're using the appName to index the config anyway,
    # we just replicate it dynamically to reduce clutter
    # Refer to the README to know exactly how an UPT config looks like
    config["appName"] = name

    # We save the config on a JSON file, to serve as the input
    # We could probably inline these and pass it as a CLI arg to Clava,
    # but this is cleaner and more readable
    if not os.path.exists(TEMP_FOLDER):
        os.makedirs(TEMP_FOLDER)
    with open(CONFIG, "w+") as f:
        json.dump(config, f, indent=4)

    # Now, we build the (very long) command to run Clava with UPT
    # In reality this could be much shorter, as many of the flags we're
    # setting here are the default values. But for extra clarity, we're
    # setting them explicitly
    clava = Clava(ENTRYPOINT)
    set_default_args(clava)

    # If we're dealing with code outside the builtin benchmarks,
    # we need to further specify the workspace. Furthermore, we need
    # to specify the standard. Since all of this is part of the config,
    # we could just pass the JSON and let Clava handle it, but now we
    # have the same old philosophical question of whether Clava should
    # control UPT, or UPT should control Clava. We're going with a mix
    # of both, with enough leeway to choose one way or the other further
    # down the line (which further depends on the partitioning component,
    # since we're now detaching that from UPT's task graph itself)
    if config["provenance"] != "BUILTIN":
        clava.set_workspace(INPUT_DIR + name)
    clava.set_standard(config["standard"])

    # Go, Clava, go!
    clava.run(True)

    # If that went well, we'll probably have a bunch of output files
    # Some of which are dotfiles, which we can now render onto pretty,
    # crisp and MASSIVELY MASSIVE PNGs
    dotfiles = [
        f"{out_folder}/taskgraph/{name}_taskgraph.dot",
        f"{out_folder}/taskgraph/{name}_taskgraph_min.dot",
        f"{out_folder}/estimations/{name}_taskgraph_annotated.dot",
        f"{out_folder}/app_stats_original/{name}_callgraph.dot",
        f"{out_folder}/app_stats_tasks/{name}_callgraph.dot",
    ]

    for dot in dotfiles:
        generate_image_from_dot(dot)
