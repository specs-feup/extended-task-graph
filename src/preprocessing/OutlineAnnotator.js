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
        const wrappedRegions = [];
        for (const region of filteredRegions) {
            const start = region[0];
            const end = region[1];
            this.log("Region from " + start + " to " + end);
            const wrapper = this.#wrapRegion(start, end);
            wrappedRegions.push(wrapper);
        }

        this.log("Finished annotating outlining regions")
        return wrappedRegions;
    }

    #filterRegions(regions) {
        const filteredRegions = [];

        for (const region of regions) {
            filteredRegions.push(region);
        }
        return filteredRegions;
    }

    #findRegionsInScope(scope) {
        const regions = [];
        let currStart = null;
        let currEnd = null;

        for (const stmt of scope.children) {
            if (!this.#hasFunctionCalls(stmt)) {
                if (currStart == null) {
                    currStart = stmt;
                    currEnd = stmt;
                }
                else {
                    currEnd = stmt;
                }
            }
            else {
                if (currStart != null) {
                    regions.push([currStart, currEnd]);
                }
                // not sure if this covers all calses
                if (stmt.instanceOf(["switch", "loop", "if"])) {
                    for (const child of stmt.children) {
                        if (child.instanceOf("body")) {
                            const childRegions = this.#findRegionsInScope(child);
                            regions.push(...childRegions);
                        }
                    }
                }
                currStart = null;
                currEnd = null;
            }
        }
        return regions;
    }

    #wrapRegion(start, end) {
        const beginWrapper = ClavaJoinPoints.stmtLiteral("#pragma clava_outline_begin\n");
        const endWrapper = ClavaJoinPoints.stmtLiteral("#pragma clava_outline_end\n");

        start.insertBefore(beginWrapper);
        end.insertAfter(endWrapper);

        const res = [beginWrapper, endWrapper];
        return res;
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
            if (!uniqueFuns.some(elem => elem.signature === fun.signature)) {
                uniqueFuns.push(fun);
            }
        }
        return uniqueFuns;
    }

    #getEligibleFunctionsFrom(parent) {
        const funs = [];

        for (const call of Query.searchFrom(parent, "call")) {
            const fun = call.function;
            if (fun.hasDefinition) {
                funs.push(fun);
                const children = this.#getEligibleFunctionsFrom(fun);
                funs.push(...children);
            }
        }
        return funs;
    }
}