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
        this.#removeRegisterQualifiers();
        this.#removeAllComments();
    }

    #removeAllComments() {
        // comments within wrapperStmts first
        for (const stmt of Query.search("wrapperStmt")) {
            if (stmt.children.length == 1 && stmt.children[0].instanceOf("comment")) {
                stmt.detach();
            }
        }
        // then comments on their lonesome
        this.#nukeAll("comment");
    }

    #removeRegisterQualifiers() {
        for (const decl of Query.search("vardecl", { storageClass: "register" })) {
            decl.setStorageClass("none");
        }
    }

    #nukeAll(type) {
        for (const stmt of Query.search(type)) {
            stmt.detach();
        }
    }
}