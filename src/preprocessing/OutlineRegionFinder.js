"use strict";

laraImport("clava.ClavaJoinPoints");
laraImport("clava.code.Outliner");
laraImport("weaver.Query");
laraImport("UPTStage");
laraImport("util/ExternalFunctionsMatcher");

class OutlineRegionFinder extends UPTStage {
    #startFunction;

    constructor(startFunction) {
        super("CTFlow-Preprocessor-AppOutliner");
        this.#startFunction = startFunction;
    }

    annotate() {
        this.log("Beginning the annotation of outlining regions");

        const funs = this.#getEligibleFunctions();
        const regions = [];

        for (const fun of funs) {
            //const nCalls = Query.searchFrom(fun, "call").chain().length;
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

        this.log("Finished annotating outlining regions")
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
                    if (this.#hasFunctionCalls(body)) {
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

        const beginWrapper = ClavaJoinPoints.stmtLiteral("#pragma clava_outline_begin\n");
        const endWrapper = ClavaJoinPoints.stmtLiteral("#pragma clava_outline_end\n");

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

    #getEligibleFunctions() {
        const funs = [];
        const start = Query.search("function", { name: this.#startFunction }).getFirst();

        funs.push(start);
        const childrenFuns = this.#getEligibleFunctionsFrom(start);
        funs.push(...childrenFuns);

        const uniqueFuns = [];
        for (const fun of funs) {
            if (!uniqueFuns.some(elem => elem.signature === fun.signature) && fun) {
                uniqueFuns.push(fun);
            }
        }
        return uniqueFuns;
    }

    // returns all the functions that are valid for outlining
    #getEligibleFunctionsFrom(parent) {
        const funs = [];

        for (const call of Query.searchFrom(parent, "call")) {
            const fun = call.function;
            if (fun.hasDefinition && fun.isImplementation) {
                funs.push(fun);
                const children = this.#getEligibleFunctionsFrom(fun);
                funs.push(...children);
            }
        }
        return funs;
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