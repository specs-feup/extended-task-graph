import { Call, DeclStmt, Expression, ExprStmt, If, Loop, ReturnStmt, Statement, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
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
                new PrematureReturn(),
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
            hasOneUsefulStmt ||= stmt instanceof Loop;
            hasOneUsefulStmt ||= stmt instanceof If;

            if (hasOneUsefulStmt) {
                break;
            }
        }
        return hasOneUsefulStmt;
    }
}

class PrematureReturn implements OutlineRegionScenario {
    getName(): string {
        return "PrematureReturn";
    }

    validate(region: Statement[]): boolean {
        if (region.length != 1) {
            return true;
        }
        const stmt = region[0];
        if (stmt instanceof If) {
            const cond = stmt.cond;
            if (cond.code.includes("__prematureExit")) {
                return false;
            }
            else {
                return true;
            }
        }
        else {
            return true;
        }
    }
}

class TrivialReturn implements OutlineRegionScenario {
    getName(): string {
        return "TrivialReturn";
    }

    validate(region: Statement[]): boolean {
        let isValid = true;
        for (const stmt of region) {
            if (stmt instanceof If) {
                isValid &&= this.validateSubregion(stmt.then.stmts);
                if (stmt.else != null) {
                    isValid &&= this.validateSubregion(stmt.else.stmts);
                }
            }
            else if (stmt instanceof Loop) {
                isValid &&= this.validateSubregion(stmt.body.stmts);
            }
            else {
                isValid &&= this.validateStmt(stmt);
            }
        }
        return isValid;
    }

    validateSubregion(region: Statement[]): boolean {
        const scope2or3stmts = region.length >= 2 && region.length <= 3;
        const lastIsReturn = region.at(-1) instanceof ReturnStmt;

        if (scope2or3stmts && lastIsReturn) {
            return this.validateStmt(region[0]);
        }
        return true;
    }

    validateStmt(jp: Statement | Expression): boolean {
        return Query.searchFromInclusive(jp, Varref, v => {
            const conds = [
                v.name.startsWith(DefaultPrefix.RETURN_VAR),
                v.name == "__doContinue",
                v.name.startsWith("__rtr_val") || v.name.startsWith("__rtr_flag"),
                v.name.startsWith("__premExitParam") || v.name.startsWith("__prematureExit")
            ];
            return conds.reduce((a, b) => a || b, false);
        }).get().length == 0;
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