"use strict";

const OutputDirectories = {
    // Stats about the source code (i.e., AST-level analysis)
    APP_STATS_ORIGINAL: "app_stats/original",
    APP_STATS_TASKS: "app_stats/taskform",

    // Weaved source code at different stages
    SRC_ORIGINAL: "src/original",
    SRC_SUBSET: "src/taskform_partial",
    SRC_TASKS: "src/taskform_ready",
    SRC_TASKS_INSTRUMENTED: "src/taskform_ready_instrumented",

    // Stats about the task graph
    TASKGRAPH: "taskgraph",
}