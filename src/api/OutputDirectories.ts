export enum AppDumpOutput {
    APP_STATS_PARENT = "ast",
    APP_STATS_ORIGINAL = "original",
    APP_STATS_TASKS = "trans"
}

export enum SourceCodeOutput {
    SRC_PARENT = "src",
    SRC_ORIGINAL = "original",
    SRC_SUBSET = "subset",
    SRC_TASKS = "trans",
    SRC_TASKS_INSTRUMENTED = "trans_instr"
}

export enum TaskGraphOutput {
    ETG_PARENT = "etg",
    ETG_DEFAULT = "default"
}