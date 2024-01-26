import os
import json
import subprocess
from string import Template


class Clava:
    def __init__(self, main_file):
        self.cmd_simple = set()
        self.cmd_verbose = set()
        self.main_file = main_file

    def _add(self, simple, verbose):
        self.cmd_simple.add(simple)
        self.cmd_verbose.add(verbose)

    def _remove_from_set(self, set, prefix):
        for item in set:
            if item.startswith(prefix + " "):
                set.remove(item)

    def _join_inputs(self, input_data):
        if isinstance(input_data, str):
            return input_data
        elif isinstance(input_data, (list, tuple)):
            return "\\;".join(str(item) for item in input_data)
        else:
            raise TypeError("Input must be a string or a list/tuple of elements")

    def _build_command_args(self, verbose=False):
        if verbose:
            return " ".join(self.cmd_verbose)
        else:
            return " ".join(self.cmd_simple)

    def _encode_json(self, json_dict):
        json_string = json.dumps(json_dict)
        escaped_string = subprocess.list2cmdline([json_string])
        return escaped_string

    def run(self, verbose=False):
        final_cmd = self.get_current_command(verbose)

        if verbose:
            info = Template("Running Clava with the following command:\n\t$cmd\n")
            print(info.substitute(cmd=final_cmd))

        ret = os.system(final_cmd)
        return ret

    def get_current_command(self, verbose=False):
        base_cmd = Template("clava $main_file $args")
        args = self._build_command_args(verbose)
        final_cmd = base_cmd.substitute(main_file=self.main_file, args=args)
        return final_cmd

    def reset_command(self):
        self.cmd_simple = set()
        self.cmd_verbose = set()

    def set_main_file(self, main_file):
        self.main_file = main_file

    def set_parallel_parsing(self):
        self._add("-par", "--parallel-parsing")

    def set_parse_includes(self):
        self._add("-pi", "--parse-includes")

    def set_custom_resources(self):
        self._add("-cr", "--custom-resources")

    def set_clean_intermediate_files(self):
        self._add("-cl", "--cl")

    def set_check_syntax(self):
        self._add("-cs", "--check-syntax")

    def set_show_stack(self):
        self._add("-s", "--stack")

    def set_copy_files_in_sources(self):
        self._add("-cfs", "--copy-files-in-sources")

    def set_no_clava_info(self):
        self._add("-nci", "--no-clava-info")

    def set_no_code_generation(self):
        self._add("-ncg", "--no-code-gen")

    def set_allow_custom_resources(self):
        self._add("-cr", "--custom-resources")

    def set_flat_output_folder(self):
        self._add("-flo", "--flat-output-folder")

    def set_standard(self, standard):
        self._remove_from_set(self.cmd_simple, "-std")
        self._remove_from_set(self.cmd_verbose, "-std")
        self._add("-std " + standard, "-std " + standard)

    def set_workspace(self, path):
        self._remove_from_set(self.cmd_simple, "-p")
        self._remove_from_set(self.cmd_verbose, "--workspace")
        self._add("-p " + path, "--workspace " + path)

    def set_output_folder_name(self, name):
        self._remove_from_set(self.cmd_simple, "-of")
        self._remove_from_set(self.cmd_verbose, "--output-foldername")
        self._add("-of " + name, "--output-foldername " + name)

    def set_args(self, json):
        args = self._encode_json(json)
        self._remove_from_set(self.cmd_simple, "-av")
        self._remove_from_set(self.cmd_verbose, "--argv")
        self._add("-av " + args, "--argv " + args)

    def set_verbosity(self, level=0):
        self._remove_from_set(self.cmd_simple, "-b")
        self._remove_from_set(self.cmd_verbose, "--verbose")
        self._add("-b " + str(level), "--verbose " + str(level))

    def set_clang_flag(self, flag):
        self._remove_from_set(self.cmd_simple, "-fs")
        self._remove_from_set(self.cmd_verbose, "--flags")
        self._add(f'-fs "{flag}"', f'--flags "{flag}"')

    def set_libc_default(self):
        self._remove_from_set(self.cmd_simple, "-lib")
        self._remove_from_set(self.cmd_verbose, "--libc-cxx-mode")

    def set_libc_clava_builtins(self):
        self._remove_from_set(self.cmd_simple, "-lib")
        self._remove_from_set(self.cmd_verbose, "--libc-cxx-mode")
        self._add(
            '-lib "Clava base built-ins"',
            '--libc-cxx-mode "Clava base built-ins"',
        )

    def set_libc_clava_plus(self):
        self._remove_from_set(self.cmd_simple, "-lib")
        self._remove_from_set(self.cmd_verbose, "--libc-cxx-mode")
        self._add(
            '-lib "Clava base built-ins + libc/libc++"',
            '--libc-cxx-mode "Clava base built-ins + libc/libc++"',
        )

    def set_libc_system_libs(self):
        self._remove_from_set(self.cmd_simple, "-lib")
        self._remove_from_set(self.cmd_verbose, "--libc-cxx-mode")
        self._add(
            '-lib "Nothing (i.e. use system libs)"',
            '--libc-cxx-mode "Nothing (i.e. use system libs)"',
        )

    def set_extra_includes_folder(self, paths):
        if len(paths) == 0:
            return
        includes = []
        for path in paths:
            includes.append(os.path.normpath(path))

        joined_includes = self._join_inputs(includes)
        self._add("-i " + joined_includes, "--includes " + joined_includes)

    def set_dependencies(self, dependencies):
        if len(dependencies) == 0:
            return
        dependencies = self._join_inputs(dependencies)
        self._add("-dep " + dependencies, "--dependencies " + dependencies)
