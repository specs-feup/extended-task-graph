import { BinaryOp, Comment, Decl, DeclStmt, Joinpoint, LabelStmt, Scope, StorageClass, Vardecl, Varref, WrapperStmt } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { AStage } from "../../AStage.js";

export class CodeSanitizer extends AStage {
    constructor(topFunction: string) {
        super("TransFlow-Subset-CodeSanitizer", topFunction);
    }

    sanitize(): void {
        const nuked = this.#nukeAll(LabelStmt);
        this.log(nuked > 0 ? `Nuked ${nuked} labels` : "No labels to nuke");

        const regs = this.removeRegisterQualifiers();
        this.log(regs > 0 ? `Removed ${regs} register qualifiers` : "No register qualifiers to remove");

        const comms = this.removeAllComments();
        this.log(comms > 0 ? `Removed ${comms} comments` : "No comments to remove");

        const brackets = this.forceBracketsInScopes();
        this.log(brackets > 0 ? `Forced brackets in ${brackets} scopes` : "No scopes to force brackets in");

        this.logSuccess("Sanitized code");
    }

    // removes statements like "a = a;"
    removeSpuriousStatements(): number {
        let count: number = 0;

        for (const op of Query.search(BinaryOp, { kind: "assign" })) {
            const right = op.right;
            const left = op.left;

            if (right instanceof Varref && left instanceof Varref) {
                if (right.name == left.name && right.children.length == 0 && left.children.length == 0) {
                    op.parent.detach();
                    count++;
                }
            }
        }
        return count;
    }

    removeDuplicatedDecls(): number {
        let count: number = 0;

        for (const scope of Query.search(Scope)) {
            const declNamesInScope: string[] = [];
            const toDetach = [];

            for (const child of scope.children) {
                if (child instanceof DeclStmt) {
                    const decl = child.children[0] as Vardecl;
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
                count++;
            }
        }
        return count;
    }

    forceBracketsInScopes(): number {
        let count: number = 0;

        for (const scope of Query.search(Scope, { naked: true })) {
            scope.naked = false;
            count++;
        }
        return count;
    }

    removeAllComments(): number {
        let count: number = 0;

        // comments within wrapperStmts first
        for (const stmt of Query.search(WrapperStmt)) {
            if (stmt.children.length == 1 && stmt.children[0] instanceof Comment) {
                stmt.detach();
                count++;
            }
        }
        // then comments on their lonesome
        count += this.#nukeAll(Comment);
        return count;
    }

    removeRegisterQualifiers(): number {
        let count: number = 0;

        for (const decl of Query.search(Vardecl, { storageClass: StorageClass.REGISTER })) {
            decl.setStorageClass(StorageClass.NONE);
            count++;
        }
        return count;
    }

    #nukeAll(jpType: any): number {
        let count: number = 0;

        for (const stmt of Query.search(jpType)) {
            stmt.detach();
            count++;
        }
        return count;
    }
}