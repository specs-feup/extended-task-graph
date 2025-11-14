import { DeclStmt, ExprStmt, ReturnStmt, Statement, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { DefaultPrefix } from "../../api/PreSuffixDefaults.js";

export class OutlineRegionValidator {
    private scenarios: OutlineRegionScenario[];

    constructor(scenarios?: OutlineRegionScenario[]) {
        if (scenarios == undefined) {
            this.scenarios = [
                new AllUselessStatements(),
                new TrivialReturn(),
                new NoInitDecls()
            ];
        }
        else {
            this.scenarios = scenarios;
        }
    }

    public validate(region: Statement[]): boolean {
        if (region.length == 0) {
            return false;
        }
        for (const scenario of this.scenarios) {
            if (!scenario.validate(region)) {
                return false;
            }
        }
        return true;
    }
}

export interface OutlineRegionScenario {
    validate(region: Statement[]): boolean;
}

class AllUselessStatements implements OutlineRegionScenario {
    validate(region: Statement[]): boolean {
        if (region.length == 0) {
            return false;
        }

        let hasOneUsefulStmt = false;
        for (const stmt of region) {
            hasOneUsefulStmt ||= stmt instanceof DeclStmt;
            hasOneUsefulStmt ||= stmt instanceof ReturnStmt;
            hasOneUsefulStmt ||= stmt instanceof ExprStmt;

            if (hasOneUsefulStmt) {
                break;
            }
        }
        return hasOneUsefulStmt;
    }
}

class TrivialReturn implements OutlineRegionScenario {
    validate(region: Statement[]): boolean {
        if (region.length == 2 && region[1] instanceof ReturnStmt) {
            const isTrivialReturn = Query.searchFrom(region[0], Varref, { name: DefaultPrefix.RETURN_VAR }).chain().length > 0;
            if (isTrivialReturn) {
                return false;
            }
        }
        return true;
    }
}

class NoInitDecls implements OutlineRegionScenario {
    validate(region: Statement[]): boolean {
        let oneDeclWithInit = false;
        let otherStmts = false;
        for (const stmt of region) {
            if (stmt instanceof DeclStmt) {
                // stmt.decls could also work and simplify this, assuming it only returns vardecls
                for (const child of stmt.children) {
                    if (!(child instanceof Vardecl)) {
                        continue;
                    }

                    const decl = child as Vardecl;
                    if (decl.children.length > 0) {
                        oneDeclWithInit = true;
                        break;
                    }
                }
            }
            else if (stmt instanceof ExprStmt || stmt instanceof ReturnStmt) {
                otherStmts = true;
                break;
            }
        }
        if (!oneDeclWithInit && !otherStmts) {
            return false;
        }
        return true;
    }
}