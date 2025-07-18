export enum AppDumpOutput {
    APP_STATS_PARENT = "ast",
    APP_STATS_ORIGINAL = "original",
    APP_STATS_TASKS = "trans"
}

export enum SourceCodeOutput {
    SRC_PARENT = "src",
    SRC_ORIGINAL = "golden",
    SRC_INTERMEDIATE = "red-inter",
    SRC_SUBSET = "red",
    SRC_TASKS = "red-taskready",
    SRC_TASKS_INSTRUMENTED = "red-taskready-instr"
}

export enum TaskGraphOutput {
    ETG_PARENT = "etg",
    ETG_DEFAULT = "default"
}