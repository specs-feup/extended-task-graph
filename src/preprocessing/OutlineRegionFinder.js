"use strict";

laraImport("lara.util.IdGenerator");
laraImport("clava.ClavaJoinPoints");
laraImport("clava.code.Outliner");
laraImport("weaver.Query");
laraImport("UPTStage");
laraImport("util/ExternalFunctionsMatcher");
laraImport("util/ClavaUtils");

class OutlineRegionFinder extends UPTStage {
    constructor(topFunction) {
        super("CTFlow-Preprocessor-AppOutliner", topFunction);
    }

    annotateGenericPass() {
        this.log("Beginning the annotation of generic outlining regions");

        const funs = ClavaUtils.getAllUniqueFunctions(this.getTopFunction());
        const regions = [];

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

    annotateLoopPass() {
        this.log("Beginning the annotation of loop outlining regions");

        const funs = ClavaUtils.getAllUniqueFunctions(this.getTopFunction());
        let outlinedCount = 0;

        for (const fun of funs) {
            for (const loop of Query.searchFrom(fun, "loop")) {
                outlinedCount += this.#handleLoopRegion(loop);
            }
        }
        this.log("Finished annotating loop outlining regions");
        return outlinedCount;
    }

    #handleLoopRegion(loop) {
        let outlinedCount = 0;
        const scope = loop.body;

        const callsInScope = [];
        const loopsInScope = [];

        for (const stmt of scope.children) {
            if (stmt.instanceOf("loop")) {
                loopsInScope.push(stmt);
            }
            if (stmt.instanceOf("exprStmt") && stmt.children[0].instanceOf("call")) {
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
            const wrappedRegion = this.#wrapRegion(scope.children);
            this.#outlineRegion(wrappedRegion, "outlined_loop_");

            return outlinedCount + 1;
        }
    }

    #outlineRegion(wrappedRegion, prefix) {
        const start = wrappedRegion[0];
        const end = wrappedRegion[wrappedRegion.length - 1];

        const outliner = new Outliner();
        outliner.setVerbosity(false);
        const fname = prefix + IdGenerator.next();

        outliner.outlineWithName(start, end, fname);
        start.detach();
        end.detach();
    }

    #validateRegion(region) {
        let hasOneUsefulStmt = false;
        for (const stmt of region) {
            hasOneUsefulStmt = !stmt.instanceOf(["wrapperStmt", "declStmt", "returnStmt"]);
            if (hasOneUsefulStmt) {
                break;
            }
        }
        if (!hasOneUsefulStmt) {
            return false;
        }

        // having at least one useful statement is not enough
        // we need to check a few more things
        if (region.length == 2 && region[1].instanceOf("returnStmt")) {
            const isTrivialReturn = Query.searchFrom(region[0], "varref", { name: "rtr_val" }).chain().length > 0;
            if (isTrivialReturn) {
                return false;
            }
        }
        return true;
    }

    #filterRegions(regions) {
        const filteredRegions = [];

        for (const region of regions) {
            const valid = this.#validateRegion(region);
            if (valid) {
                filteredRegions.push(region);
            }
        }
        return filteredRegions;
    }

    #isTrivialIf(scope) {
        if (scope.children.length == 2 && scope.children[1].instanceOf("returnStmt")) {
            const isTrivialReturn = Query.searchFrom(scope.children[0], "varref", { name: "rtr_val" }).chain().length > 0;
            if (isTrivialReturn) {
                println("trivial return found");
                println(scope.children[0].code);
                println(scope.children[1].code);
            }
            return isTrivialReturn;
        }
        return false;
    }

    #findRegionsInScope(scope) {
        const regions = [];
        const extraScopes = [];
        let currRegion = [];

        for (const stmt of scope.children) {
            if (stmt.instanceOf(["if", "loop"])) {
                const bodies = [];
                for (const child of stmt.children) {
                    if (child.instanceOf("body")) {
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
                currRegion.push(stmt);
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

    #wrapRegion(region) {
        const start = region[0];
        const end = region[region.length - 1];

        // ensure that wrapping outline regions is idempotent, that is,
        // if a region is already wrapped, we don't wrap it again
        // this compensates for a bug in the loop outlining algorithm
        // where the same region was getting outlined multiple times,
        // with as many outlinings as the depth of its scope in a loop nest
        // that's an interesting pattern to look into, but for now we just
        // make sure that we don't outline the same region multiple times
        if (start.instanceOf("wrapperStmt") && end.instanceOf("wrapperStmt")) {
            const pragmaStart = start.children[0].code;
            const pragmaEnd = end.children[0].code;
            const idStart = pragmaStart.match(/#pragma clava_outline_begin (.*)/)[1];
            const idEnd = pragmaEnd.match(/#pragma clava_outline_end (.*)/)[1];

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

    #hasFunctionCalls(jp) {
        if (jp.instanceOf("call")) {
            const isValidExternal = ExternalFunctionsMatcher.isValidExternal(jp.function);
            return !isValidExternal;
        }

        for (const call of Query.searchFrom(jp, "call")) {
            const fun = call.function;
            const isValidExternal = ExternalFunctionsMatcher.isValidExternal(fun);
            if (!isValidExternal) {
                return true;
            }
        }
        return false;
    }

    // returns the calls in a function that are not to external functions
    #getEffectiveCallsInFunction(fun) {
        const calls = [];
        for (const call of Query.searchFrom(fun, "call")) {
            if (this.#hasFunctionCalls(call)) {
                calls.push(call);
            }
        }
        return calls;
    }
}