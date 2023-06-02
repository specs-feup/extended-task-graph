"use strict";

laraImport("clava.ClavaJoinPoints");
laraImport("weaver.Query");
laraImport("UPTStage");

class CodeSanitizer extends UPTStage {
    constructor() {
        super("Preprocessor-CodeSanitizer");
    }

    sanitize() {
        this.#nukeAll("labelStmt");
    }

    #nukeAll(type) {
        for (const stmt of Query.search(type)) {
            stmt.detach();
        }
    }
}