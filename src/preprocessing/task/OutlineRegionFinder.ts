import { Body, Call, ExprStmt, FunctionJp, If, Joinpoint, Loop, ReturnStmt, Scope, Statement, Varref, WrapperStmt } from "@specs-feup/clava/api/Joinpoints.js";
import { AStage } from "../../AStage.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import IdGenerator from "@specs-feup/lara/api/lara/util/IdGenerator.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { ExternalFunctionsMatcher } from "../../util/ExternalFunctionsMatcher.js";
import { Outliner } from "@specs-feup/clava-code-transforms/Outliner";
import { DefaultPrefix } from "../../api/PreSuffixDefaults.js";
import { OutlineRegionValidator } from "./OutlineRegionValidator.js";
import { SourceCodeOutput } from "../../api/OutputDirectories.js";

export class OutlineRegionFinder extends AStage {
    constructor(topFunction: string, outputDir: string, appName: string) {
        super("TransFlow-TaskPrep-Outliner", topFunction, outputDir, appName);
    }

    public outlineGenericRegions(): number {
        this.log("Beginning the annotation of generic outlining regions");

        const funs = ClavaUtils.getAllUniqueFunctions(this.getTopFunctionJoinPoint());
        const regions: Statement[][] = [];

        for (const fun of funs) {
            const nCalls = this.getEffectiveCallsInFunction(fun).length;

            // if the function has no calls, there is no need to outline it
            if (nCalls == 0) {
                this.log(fun.name + ": no outlining regions found");
            }
            else {
                // find all outlining regions of the function
                const funRegions = this.findRegionsInScope(fun.body);
                regions.push(...funRegions);

                this.log(fun.name + ": found " + funRegions.length + " outlining regions");
            }
        }
        this.log(`Found ${regions.length} outlining regions in total`);
        const filteredRegions = this.filterRegions(regions);

        const wrappedRegion: Statement[][] = [];
        for (const region of filteredRegions) {
            wrappedRegion.push(this.wrapRegion(region, false));
        }
        this.generateIntermediateCode("t1-outlining-gen-pre", "generic annotated outlining regions");

        for (const region of wrappedRegion) {
            this.outlineRegion(region, DefaultPrefix.OUTLINED_FUN);
        }

        this.log("Finished annotating generic outlining regions");
        this.generateIntermediateCode("t1-outlining-gen-post", "generic outlined regions");
        return wrappedRegion.length;
    }

    public outlineLoops(): number {
        this.log("Beginning the annotation of loop outlining regions");

        const funs = ClavaUtils.getAllUniqueFunctions(this.getTopFunctionJoinPoint());
        let outlinedCount = 0;

        for (const fun of funs) {
            for (const loop of Query.searchFrom(fun, Loop)) {
                outlinedCount += this.handleLoopRegion(loop);
            }
        }
        this.log("Finished annotating loop outlining regions");
        this.generateIntermediateCode("t1-outlining-loop", "loop outlined regions");
        return outlinedCount;
    }

    private generateIntermediateCode(subfolder: string, message: string): void {
        const dir = `${SourceCodeOutput.SRC_PARENT}/${SourceCodeOutput.SRC_TASKS}-${subfolder}`;
        const path = this.generateCode(dir);
        this.logOutput(`Source code with ${message} written to `, path);
    }

    private handleLoopRegion(loop: Loop): number {
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
                if (this.hasFunctionCalls(call)) {
                    callsInScope.push(call);
                }
            }
        }

        for (const childLoop of loopsInScope) {
            outlinedCount += this.handleLoopRegion(childLoop);
        }

        const cond1 = callsInScope.length == 0 && loopsInScope.length == 0;
        const cond2 = callsInScope.length == 1 && loopsInScope.length == 0;
        const cond3 = callsInScope.length == 0 && loopsInScope.length == 1;

        if (cond1 || cond2 || cond3) {
            return outlinedCount;
        }
        else {
            const wrappedRegion = this.wrapRegion(scope.children as Statement[], true);
            this.outlineRegion(wrappedRegion, DefaultPrefix.OUTLINED_LOOP);

            return outlinedCount + 1;
        }
    }

    private outlineRegion(wrappedRegion: Statement[], prefix: string): void {
        const start = wrappedRegion[0] as WrapperStmt;
        const end = wrappedRegion[wrappedRegion.length - 1] as WrapperStmt;

        const outliner = new Outliner(true);
        outliner.setDefaultPrefix(prefix);

        const fname = IdGenerator.next(prefix);

        //outliner.outlineWithName(start, end, fname);
        outliner.outlineWithWrappers(start, end);
        start.detach();
        end.detach();
        this.log(`Outlined region into function "${fname}"`);
    }

    private filterRegions(regions: Statement[][]): Statement[][] {
        const filteredRegions = [];

        for (const region of regions) {
            const validator = new OutlineRegionValidator();
            const valid = validator.validate(region);

            if (valid) {
                filteredRegions.push(region);
            }
        }
        return filteredRegions;
    }

    private isTrivialIf(scope: Scope): boolean {
        if (scope.children.length == 2 && scope.children[1] instanceof ReturnStmt) {
            const isTrivialReturn = Query.searchFrom(scope.children[0], Varref, { name: DefaultPrefix.RETURN_VAR }).chain().length > 0;

            if (isTrivialReturn) {
                const stmt = scope.children[0].code.replace(/\n/g, '\\n');
                const ret = scope.children[1].code.replace(/\n/g, '');
                this.log(`Found a trivial return with statements "${stmt}" and "${ret}"`);
            }

            return isTrivialReturn;
        }
        return false;
    }

    private findRegionsInScope(scope: Scope): Statement[][] {
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
                    if (this.hasFunctionCalls(body) || this.isTrivialIf(body)) {
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
            else if (this.hasFunctionCalls(stmt)) {
                if (currRegion.length > 0) {
                    regions.push(currRegion);
                    currRegion = [];
                }
            }
            else if (stmt instanceof ReturnStmt) {
                break;
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
            const extraScopeRegions = this.findRegionsInScope(extraScope);
            regions.push(...extraScopeRegions);
        }

        return regions;
    }

    private wrapRegion(region: Statement[], isLoop: boolean = false): Statement[] {
        const start = region[0];
        const end = region[region.length - 1];
        const parenFun = start.getAncestor("function") as FunctionJp;
        const prefix = (parenFun ? parenFun.name : "_noname") + (isLoop ? "_loop" : "_out");

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
            const idStart = pragmaStart.match(/#pragma clava begin_outline (.*)/)![1];
            const idEnd = pragmaEnd.match(/#pragma clava end_outline (.*)/)![1];

            if (idStart == idEnd) {
                return region;
            }
        }

        const id = IdGenerator.next(prefix);
        const beginWrapper = ClavaJoinPoints.stmtLiteral(`#pragma clava begin_outline ${id}\n`);
        const endWrapper = ClavaJoinPoints.stmtLiteral(`#pragma clava end_outline ${id}\n`);

        start.insertBefore(beginWrapper);
        end.insertAfter(endWrapper);

        const wrappedRegion = [beginWrapper, ...region, endWrapper];
        return wrappedRegion;
    }

    private hasFunctionCalls(jp: Joinpoint): boolean {
        if (jp instanceof Call) {
            const isValidExternal = ExternalFunctionsMatcher.isValidExternal(jp);
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
    private getEffectiveCallsInFunction(fun: FunctionJp): Call[] {
        const calls = [];
        for (const call of Query.searchFrom(fun, Call)) {
            if (this.hasFunctionCalls(call)) {
                calls.push(call);
            }
        }
        return calls;
    }
}