class ClavaConfig:
    def __init__(self):
        self.cmd_simple = set()
        self.cmd_verbose = set()

    def _add(self, simple, verbose):
        self.cmd_simple.add(simple)
        self.cmd_verbose.add(verbose)

    def _remove_from_set(self, set, prefix):
        for item in set:
            if item.startswith(prefix):
                set.remove(item)

    def build_command(self, verbose=False):
        if verbose:
            return " ".join(self.cmd_verbose)
        else:
            return " ".join(self.cmd_simple)

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

    def set_verbosity(self, level=0):
        self._remove_from_set(self.cmd_simple, "-b")
        self._remove_from_set(self.cmd_verbose, "-verbose")
        self._add("-b " + str(level), "-verbose " + str(level))
