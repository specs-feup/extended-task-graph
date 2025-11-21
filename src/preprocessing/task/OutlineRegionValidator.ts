import { Call, DeclStmt, ExprStmt, ReturnStmt, Statement, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { DefaultPrefix } from "../../api/PreSuffixDefaults.js";

export class OutlineRegionValidator {
    private scenarios: OutlineRegionScenario[];

    constructor(scenarios?: OutlineRegionScenario[]) {
        if (scenarios == undefined) {
            this.scenarios = [
                new EmptyRegion(),
                new SingleCallStatement(),
                new AllUselessStatements(),
                new TrivialReturn(),
                new NoInitDecls()
            ];
        }
        else {
            this.scenarios = scenarios;
        }
    }

    public validate(region: Statement[]): [boolean, string] {
        for (const scenario of this.scenarios) {
            if (!scenario.validate(region)) {
                return [false, scenario.getName()];
            }
        }
        return [true, ""];
    }
}

export interface OutlineRegionScenario {
    getName(): string;
    validate(region: Statement[]): boolean;
}

class EmptyRegion implements OutlineRegionScenario {
    getName(): string {
        return "EmptyRegion";
    }

    validate(region: Statement[]): boolean {
        return region.length > 0;
    }
}

class SingleCallStatement implements OutlineRegionScenario {
    getName(): string {
        return "SingleCallStatement";
    }

    validate(region: Statement[]): boolean {
        if (region.length == 1 && region[0] instanceof ExprStmt) {
            const exprStmt = region[0] as ExprStmt;
            const calls = Query.searchFrom(exprStmt, Call).get();
            if (calls.length == 1) {
                return false;
            }
        }
        return true;
    }
}

class AllUselessStatements implements OutlineRegionScenario {
    getName(): string {
        return "AllUselessStatements";
    }

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
    getName(): string {
        return "TrivialReturn";
    }

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
    getName(): string {
        return "NoInitDecls";
    }

    validate(region: Statement[]): boolean {
        const allNoInitDecls = region.every((stmt) => {
            if (stmt instanceof DeclStmt) {
                const declStmt = stmt as DeclStmt;
                const noInit = declStmt.decls.every((decl) => {
                    if (decl instanceof Vardecl) {
                        const varDecl = decl as Vardecl;
                        return varDecl.init == null;
                    }
                    else {
                        return false;
                    }
                });
                return noInit;
            }
            else {
                return false;
            }
        });
        return !allNoInitDecls;
    }
}