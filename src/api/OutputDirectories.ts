export enum AppDumpOutput {
    APP_STATS_PARENT = "ast",
    APP_STATS_ORIGINAL = "golden",
    APP_STATS_TASKS = "trans"
}

export enum SourceCodeOutput {
    SRC_PARENT = "src",
    SRC_ORIGINAL = "golden",
    SRC_INTERMEDIATE = "subset-inter",
    SRC_TASKS = "subset-taskready",
    SRC_FINAL = "trans",
    SRC_FINAL_INSTRUMENTED = "trans-instr"
}

export enum TaskGraphOutput {
    ETG_PARENT = "etg",
    ETG_DEFAULT = "default"
}