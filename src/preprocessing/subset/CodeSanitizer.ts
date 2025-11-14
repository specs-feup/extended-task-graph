import { BinaryOp, Call, Comment, DeclStmt, FunctionJp, LabelStmt, Scope, Statement, StorageClass, Vardecl, Varref, WrapperStmt } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { AStage } from "../../AStage.js";
import { ScopeFlattener } from "@specs-feup/clava-code-transforms/ScopeFlattener";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import IdGenerator from "@specs-feup/lara/api/lara/util/IdGenerator.js";

export class CodeSanitizer extends AStage {
    constructor(topFunction: string) {
        super("TransFlow-Subset-CodeSanitizer", topFunction);
    }

    public sanitize(): void {
        const nuked = this.nukeAll(LabelStmt);
        this.log(nuked > 0 ? `  Nuked ${nuked} labels` : "  No labels to nuke");

        const regs = this.removeRegisterQualifiers();
        this.log(regs > 0 ? `  Removed ${regs} register qualifiers` : "  No register qualifiers to remove");

        const comms = this.removeAllComments();
        this.log(comms > 0 ? `  Removed ${comms} comments` : "  No comments to remove");

        const brackets = this.forceBracketsInScopes();
        this.log(brackets > 0 ? `  Forced brackets in ${brackets} scopes` : "  No scopes to force brackets in");

        const flattenedFuns = this.flattenAllScopes();
        this.log(flattenedFuns > 0 ? `  Flattened scopes in ${flattenedFuns} functions` : "  No scopes to flatten");

        const funDeclsInFuns = this.removeFunctionDeclsInFunctions();
        this.log(funDeclsInFuns > 0 ? ` Removed ${funDeclsInFuns} function declarations in functions` : "  No function declarations to remove");

        //const mallocs = this.singleArgumentMallocs();
        //this.log(mallocs > 0 ? `Ensured ${mallocs} calls to malloc() have no expressions as arguments` : "No mallocs to sanitize");

        this.logSuccess("code successfully sanitized.");
    }

    public singleArgumentMallocs(): number {
        let count: number = 0;

        for (const fun of this.getValidFunctions()) {
            const mallocs = Query.searchFrom(fun.body, Call, { name: "malloc" }).get();
            for (const malloc of mallocs) {
                const argExpr = malloc.args[0];
                if (argExpr instanceof Varref && argExpr.children.length === 0) {
                    continue;
                }
                const argType = ClavaJoinPoints.typeLiteral("size_t");
                const castExpr = ClavaJoinPoints.cStyleCast(argType, argExpr);

                const argVarName = IdGenerator.next("alloc_size");
                const argVar = ClavaJoinPoints.varDecl(argVarName, castExpr);

                const callStmt = malloc.getAncestor("statement") as Statement;
                callStmt.insertBefore(argVar);

                const argRef = ClavaJoinPoints.varRef(argVar);
                malloc.setArg(0, argRef);
                count++;
            }
        }

        return count;
    }

    public removeFunctionDeclsInFunctions(): number {
        let count: number = 0;

        for (const fun of this.getValidFunctions()) {
            const toRemove = Query.searchFrom(fun.body, FunctionJp, { isImplementation: false }).get();
            toRemove.forEach((decl) => {
                decl.parent.detach();
            });
            count += toRemove.length;
        }
        return count;
    }

    public flattenAllScopes(): number {
        let nFun = 0;
        const sf = new ScopeFlattener();
        for (const fun of this.getValidFunctions()) {
            const n = sf.flattenAllInFunction(fun);
            if (n > 0) {
                this.log(`Flattened ${n} scopes in function ${fun.name}`);
                nFun++;
            }
        }
        return nFun;
    }

    // removes statements like "a = a;"
    public removeSpuriousStatements(): number {
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

    public removeDuplicatedDecls(): number {
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

    public forceBracketsInScopes(): number {
        let count: number = 0;

        for (const scope of Query.search(Scope, { naked: true })) {
            scope.naked = false;
            count++;
        }
        return count;
    }

    public removeAllComments(): number {
        let count: number = 0;

        // comments within wrapperStmts first
        for (const stmt of Query.search(WrapperStmt)) {
            if (stmt.children.length == 1 && stmt.children[0] instanceof Comment) {
                stmt.detach();
                count++;
            }
        }
        // then comments on their lonesome
        count += this.nukeAll(Comment);
        return count;
    }

    public removeRegisterQualifiers(): number {
        let count: number = 0;

        for (const decl of Query.search(Vardecl, { storageClass: StorageClass.REGISTER })) {
            decl.setStorageClass(StorageClass.NONE);
            count++;
        }
        return count;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private nukeAll(jpType: any): number {
        let count: number = 0;

        for (const stmt of Query.search(jpType)) {
            stmt.detach();
            count++;
        }
        return count;
    }
}