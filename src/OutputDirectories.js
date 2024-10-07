"use strict";

const OutputDirectories = {
    // Stats about the source code (i.e., AST-level analysis)
    APP_STATS_ORIGINAL: "ast/original",
    APP_STATS_TASKS: "ast/transformed",

    // Weaved source code at different stages
    SRC_ORIGINAL: "src/original",
    SRC_SUBSET: "src/subset",
    SRC_TASKS: "src/transformed",
    SRC_TASKS_INSTRUMENTED: "src/transformed_instrumented",

    // Stats about the task graph
    TASKGRAPH: "taskgraph",
}