import { Body, Call, DeclStmt, ExprStmt, FunctionJp, If, Joinpoint, Loop, ReturnStmt, Scope, Statement, Varref, WrapperStmt } from "@specs-feup/clava/api/Joinpoints.js";
import { AStage } from "../../AStage.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import Outliner from "clava-code-transformations/Outliner";
import IdGenerator from "@specs-feup/lara/api/lara/util/IdGenerator.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { ExternalFunctionsMatcher } from "../../util/ExternalFunctionsMatcher.js";

export class OutlineRegionFinder extends AStage {
    constructor(topFunction: string) {
        super("CTFlow-TaskPrep-Outliner", topFunction);
    }

    annotateGenericPass(): Statement[][] {
        this.log("Beginning the annotation of generic outlining regions");

        const funs = ClavaUtils.getAllUniqueFunctions(this.getTopFunctionJoinPoint());
        const regions: Statement[][] = [];

        for (const fun of funs) {
            const nCalls = this.#getEffectiveCallsInFunction(fun).length;

            // if the function has no calls, there is no need to outline it
            if (nCalls == 0) {
                this.log(fun.name + ": no outlining regions found");
            }
            else {
                // find all outlining regions of the function
                const funRegions = this.#findRegionsInScope(fun.body);
                regions.push(...funRegions);

                this.log(fun.name + ": found " + funRegions.length + " outlining regions");
            }
        }
        const filteredRegions = this.#filterRegions(regions);

        // finally, wrap all the regions we found
        const wrappedRegions = [];
        for (const region of filteredRegions) {
            const wrappedRegion = this.#wrapRegion(region);
            wrappedRegions.push(wrappedRegion);
        }

        this.log("Finished annotating generic outlining regions")
        return wrappedRegions;
    }

    annotateLoopPass(): number {
        this.log("Beginning the annotation of loop outlining regions");

        const funs = ClavaUtils.getAllUniqueFunctions(this.getTopFunctionJoinPoint());
        let outlinedCount = 0;

        for (const fun of funs) {
            for (const loop of Query.searchFrom(fun, Loop)) {
                outlinedCount += this.#handleLoopRegion(loop);
            }
        }
        this.log("Finished annotating loop outlining regions");
        return outlinedCount;
    }

    #handleLoopRegion(loop: Loop): number {
        let outlinedCount = 0;
        const scope: Scope = loop.body;

        const callsInScope: Call[] = [];
        const loopsInScope: Loop[] = [];

        for (const stmt of scope.children) {
            if (stmt instanceof Loop) {
                loopsInScope.push(stmt);
            }
            if (stmt instanceof ExprStmt && stmt.children[0] instanceof Call) {
                const call = stmt.children[0];
                if (this.#hasFunctionCalls(call)) {
                    callsInScope.push(call);
                }
            }
        }

        for (const childLoop of loopsInScope) {
            outlinedCount += this.#handleLoopRegion(childLoop);
        }

        const cond1 = callsInScope.length == 0 && loopsInScope.length == 0;
        const cond2 = callsInScope.length == 1 && loopsInScope.length == 0;
        const cond3 = callsInScope.length == 0 && loopsInScope.length == 1;

        if (cond1 || cond2 || cond3) {
            return outlinedCount;
        }
        else {
            const wrappedRegion = this.#wrapRegion(scope.children as Statement[]);
            this.#outlineRegion(wrappedRegion, "outlined_loop_");

            return outlinedCount + 1;
        }
    }

    #outlineRegion(wrappedRegion: Statement[], prefix: string): void {
        const start = wrappedRegion[0];
        const end = wrappedRegion[wrappedRegion.length - 1];

        const outliner = new Outliner();
        outliner.setVerbosity(false);
        const fname = prefix + IdGenerator.next();

        outliner.outlineWithName(start, end, fname);
        start.detach();
        end.detach();
    }

    #validateRegion(region: Statement[]): boolean {
        let hasOneUsefulStmt = false;
        for (const stmt of region) {
            hasOneUsefulStmt ||= stmt instanceof WrapperStmt;
            hasOneUsefulStmt ||= stmt instanceof DeclStmt;
            hasOneUsefulStmt ||= stmt instanceof ReturnStmt;

            if (hasOneUsefulStmt) {
                break;
            }
        }
        if (!hasOneUsefulStmt) {
            return false;
        }

        // having at least one useful statement is not enough
        // we need to check a few more things
        if (region.length == 2 && region[1] instanceof ReturnStmt) {
            const isTrivialReturn = Query.searchFrom(region[0], Varref, { name: "rtr_val" }).chain().length > 0;
            if (isTrivialReturn) {
                return false;
            }
        }
        return true;
    }

    #filterRegions(regions: Statement[][]): Statement[][] {
        const filteredRegions = [];

        for (const region of regions) {
            const valid = this.#validateRegion(region);
            if (valid) {
                filteredRegions.push(region);
            }
        }
        return filteredRegions;
    }

    #isTrivialIf(scope: Scope): boolean {
        if (scope.children.length == 2 && scope.children[1] instanceof ReturnStmt) {
            const isTrivialReturn = Query.searchFrom(scope.children[0], Varref, { name: "rtr_val" }).chain().length > 0;

            if (isTrivialReturn) {
                const stmt = scope.children[0].code.replace(/\n/g, '\\n');
                const ret = scope.children[1].code.replace(/\n/g, '');
                this.log(`Found a trivial return with statements "${stmt}" and "${ret}"`);
            }

            return isTrivialReturn;
        }
        return false;
    }

    #findRegionsInScope(scope: Scope): Statement[][] {
        const regions: Statement[][] = [];
        const extraScopes = [];
        let currRegion: Statement[] = [];

        for (const stmt of scope.children) {
            if (stmt instanceof If || stmt instanceof Loop) {
                const bodies = [];
                for (const child of stmt.children) {
                    if (child instanceof Body) {
                        bodies.push(child);
                    }
                }

                let atLeastOne = false;
                for (const body of bodies) {
                    if (this.#hasFunctionCalls(body) || this.#isTrivialIf(body)) {
                        atLeastOne = true;
                        break;
                    }
                }

                if (atLeastOne) {
                    if (currRegion.length > 0) {
                        regions.push(currRegion);
                        currRegion = [];
                    }
                    extraScopes.push(...bodies);
                }
                else {
                    currRegion.push(stmt);
                }
            }
            else if (this.#hasFunctionCalls(stmt)) {
                if (currRegion.length > 0) {
                    regions.push(currRegion);
                    currRegion = [];
                }
            }
            else {
                currRegion.push(stmt as Statement);
            }
        }
        // push the last region
        if (currRegion.length > 0) {
            regions.push(currRegion);
        }

        // recursively find and push regions in the scopes we found
        for (const extraScope of extraScopes) {
            const extraScopeRegions = this.#findRegionsInScope(extraScope);
            regions.push(...extraScopeRegions);
        }

        return regions;
    }

    #wrapRegion(region: Statement[]): Statement[] {
        const start = region[0];
        const end = region[region.length - 1];

        // ensure that wrapping outline regions is idempotent, that is,
        // if a region is already wrapped, we don't wrap it again
        // this compensates for a bug in the loop outlining algorithm
        // where the same region was getting outlined multiple times,
        // with as many outlinings as the depth of its scope in a loop nest
        // that's an interesting pattern to look into, but for now we just
        // make sure that we don't outline the same region multiple times
        if (start instanceof WrapperStmt && end instanceof WrapperStmt) {
            const pragmaStart = start.children[0].code;
            const pragmaEnd = end.children[0].code;
            const idStart = pragmaStart.match(/#pragma clava_outline_begin (.*)/)![1];
            const idEnd = pragmaEnd.match(/#pragma clava_outline_end (.*)/)![1];

            if (idStart == idEnd) {
                return region;
            }
        }

        const id = IdGenerator.next("OL");
        const beginWrapper = ClavaJoinPoints.stmtLiteral(`#pragma clava_outline_begin ${id}\n`);
        const endWrapper = ClavaJoinPoints.stmtLiteral(`#pragma clava_outline_end ${id}\n`);

        start.insertBefore(beginWrapper);
        end.insertAfter(endWrapper);

        const wrappedRegion = [beginWrapper, ...region, endWrapper];
        return wrappedRegion;
    }

    #hasFunctionCalls(jp: Joinpoint): boolean {
        if (jp instanceof Call) {
            const isValidExternal = ExternalFunctionsMatcher.isValidExternal(jp.function);
            return !isValidExternal;
        }

        for (const call of Query.searchFrom(jp, Call)) {
            const fun = call.function;
            const isValidExternal = ExternalFunctionsMatcher.isValidExternal(fun);
            if (!isValidExternal) {
                return true;
            }
        }
        return false;
    }

    // returns the calls in a function that are not to external functions
    #getEffectiveCallsInFunction(fun: FunctionJp): Call[] {
        const calls = [];
        for (const call of Query.searchFrom(fun, Call)) {
            if (this.#hasFunctionCalls(call)) {
                calls.push(call);
            }
        }
        return calls;
    }
}