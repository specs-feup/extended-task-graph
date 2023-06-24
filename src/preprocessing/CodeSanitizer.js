"use strict";

laraImport("clava.ClavaJoinPoints");
laraImport("weaver.Query");
laraImport("UPTStage");

class CodeSanitizer extends UPTStage {
    constructor(topFunction) {
        super("CTFlow-Preprocessor-CodeSanitizer", topFunction);
    }

    sanitize() {
        this.#nukeAll("labelStmt");
        this.removeRegisterQualifiers();
        this.removeAllComments();
        this.forceBracketsInScopes();
    }

    // removes statements like "a = a;"
    removeSpuriousStatements() {
        for (const op of Query.search("binaryOp", { kind: "assign" })) {
            const right = op.right;
            const left = op.left;

            if (right.instanceOf("varref") && left.instanceOf("varref")) {
                if (right.name == left.name && right.children.length == 0 && left.children.length == 0) {
                    op.parent.detach();
                }
            }
        }
    }

    removeDuplicatedDecls() {
        for (const scope of Query.search("scope")) {
            const declNamesInScope = [];
            const toDetach = [];

            for (const child of scope.children) {
                if (child.instanceOf("declStmt")) {
                    const decl = child.children[0];
                    const name = decl.name;

                    if (declNamesInScope.includes(name)) {
                        toDetach.push(child);
                    }
                    else {
                        declNamesInScope.push(name);
                    }
                }
            }

            for (const declStmt of toDetach) {
                declStmt.detach();
            }
        }
    }

    forceBracketsInScopes() {
        for (const scope of Query.search("scope", { naked: true })) {
            scope.naked = false;
        }
    }

    removeAllComments() {
        // comments within wrapperStmts first
        for (const stmt of Query.search("wrapperStmt")) {
            if (stmt.children.length == 1 && stmt.children[0].instanceOf("comment")) {
                stmt.detach();
            }
        }
        // then comments on their lonesome
        this.#nukeAll("comment");
    }

    removeRegisterQualifiers() {
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