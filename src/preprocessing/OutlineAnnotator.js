"use strict";

laraImport("clava.ClavaJoinPoints");
laraImport("clava.code.Outliner");
laraImport("weaver.Query");
laraImport("UPTStage");

class OutlineAnnotator extends UPTStage {
    #startFunction;

    constructor(startFunction) {
        super("Preprocessor-AppOutliner");
        this.#startFunction = startFunction;
    }

    annotate() {
        this.log("Beginning the annotation of outlining regions");

        const funs = this.#getEligibleFunctions();
        const regions = [];

        for (const fun of funs) {
            const nCalls = Query.searchFrom(fun, "call").chain().length;

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
        for (const region of filteredRegions) {
            this.#wrapRegion(region);
        }

        this.log("Finished annotating outlining regions")
        return filteredRegions;
    }

    #validateRegion(region) {
        for (const stmt of region) {
            const hasUseless = stmt.instanceOf(["wrapperStmt", "declStmt", "returnStmt"]);

            // found at least one stmt that is not a decl, comment or return
            if (!hasUseless) {
                return true;
            }
        }
        return false;
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
        let currStart = null;
        let currEnd = null;
        let currRegion = [];

        for (const stmt of scope.children) {
            if (!this.#hasFunctionCalls(stmt)) {
                if (currStart == null) {
                    currStart = stmt;
                    currEnd = stmt;
                    currRegion.push(stmt);
                }
                else {
                    currEnd = stmt;
                    currRegion.push(stmt);
                }
            }
            else {
                if (currStart != null) {
                    regions.push(Array.from(currRegion));
                }
                // not sure if this covers all cases
                if (stmt.instanceOf(["switch", "if", "loop"])) {
                    for (const child of stmt.children) {
                        if (child.instanceOf("body")) {
                            const childRegions = this.#findRegionsInScope(child);
                            regions.push(...childRegions);
                        }
                    }
                }
                currStart = null;
                currEnd = null;
                currRegion = [];
            }
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

        region.unshift(beginWrapper);
        region.push(endWrapper);
    }

    #hasFunctionCalls(jp) {
        return Query.searchFrom(jp, "call").chain().length > 0 || jp.instanceOf("call");
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
}