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
        const wrappedRegions = [];

        for (const fun of funs) {
            for (const loop of Query.searchFrom(fun, "loop")) {
                wrappedRegions.push(...this.#handleLoopRegion(loop));
            }
        }
        this.log("Finished annotating loop outlining regions");
        return wrappedRegions;
    }

    #handleLoopRegion(loop) {
        const wrappedRegions = [];
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
            const regions = this.#handleLoopRegion(childLoop);
            wrappedRegions.push(...regions);
        }

        if (callsInScope <= 1) {
            return wrappedRegions;
        }
        else {
            const wrappedRegion = this.#wrapRegion(scope);
            wrappedRegions.push(wrappedRegion);
        }

        return wrappedRegions;
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