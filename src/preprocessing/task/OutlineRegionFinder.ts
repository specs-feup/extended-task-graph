import { Call, DeclStmt, FunctionJp, If, Joinpoint, Literal, Loop, ReturnStmt, Scope, Statement, Vardecl, Varref, WrapperStmt } from "@specs-feup/clava/api/Joinpoints.js";
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
import Clava from "@specs-feup/clava/api/clava/Clava.js";

export class OutlineRegionFinder extends AStage {
    constructor(topFunction: string, outputDir: string, appName: string) {
        super("TransFlow-TaskPrep-Outliner", topFunction, outputDir, appName);
    }

    public outlineGenericRegions(iteration: number): number {
        this.log("Beginning the annotation of generic outlining regions");

        const funs = ClavaUtils.getAllUniqueFunctions(this.getTopFunctionJoinPoint());
        const regions: Statement[][] = [];

        for (const fun of funs) {
            const nCalls = this.getEffectiveCallsInFunction(fun).length;

            // if the function has no calls, there is no need to outline it
            if (nCalls == 0) {
                this.log(`  ${fun.name}: no outlining regions found`);
            }
            else {
                // find all outlining regions of the function
                const funRegions = this.findRegionsInScope(fun.body);
                regions.push(...funRegions);
                this.log(`  ${fun.name}: found ${funRegions.length} outlining regions`);
            }
        }
        this.log(`Found ${regions.length} outlining regions in total`);

        const wrappedRegions: Statement[][] = [];
        for (const region of regions) {
            wrappedRegions.push(this.wrapRegion(region, false));
        }
        this.generateIntermediateCode(`t1.${iteration}-outlining-annotated`, "generic annotated outlining regions");

        const filteredRegions = this.filterRegions(wrappedRegions);
        this.log(`Filtered ${filteredRegions.length} valid outlining regions out of ${regions.length} total`);

        let outlinedCount = 0;
        for (const region of filteredRegions) {
            outlinedCount += this.outlineRegion(region, DefaultPrefix.OUTLINED_FUN);
        }

        this.log("Finished annotating generic outlining regions");
        this.generateIntermediateCode(`t1.${iteration}-outlining-generic`, "generic outlined regions");
        return outlinedCount;
    }

    public updateDecls(): boolean {
        this.log("Moving decls of outlined functions to their beginning");
        try {
            Clava.rebuild();
            this.log("Successfully moved decls of outlined functions to their beginning");
        }
        catch (e) {
            this.logError(`${e}`);
            this.logError("Could not move decls of outlined functions to their beginning");
            return false;
        }

        for (const fun of ClavaUtils.getAllUniqueFunctions(this.getTopFunctionJoinPoint())) {
            for (const scope of Query.searchFrom(fun, Scope)) {
                const simpleDecls: DeclStmt[] = [];
                const arrayDecls: DeclStmt[] = [];

                for (const stmt of scope.stmts) {
                    if (stmt instanceof DeclStmt) {
                        const noInits = stmt.decls.every((decl) => {
                            if (decl instanceof Vardecl) {
                                return !decl.hasInit ||
                                    (decl.hasInit && decl.init instanceof Literal);
                            }
                        });
                        if (!noInits) {
                            continue;
                        }
                        if (stmt.decls.every(decl => decl.type.isArray)) {
                            arrayDecls.push(stmt);
                        }
                        else {
                            simpleDecls.push(stmt);
                        }
                    }
                }
                const allDecls = [...simpleDecls, ...arrayDecls].reverse();
                for (const decl of allDecls) {
                    decl.detach();
                    scope.insertBegin(decl);
                }
            }
        }
        return true;
    }

    private generateIntermediateCode(subfolder: string, message: string): void {
        const dir = `${SourceCodeOutput.SRC_PARENT}/${SourceCodeOutput.SRC_TASKS}/${subfolder}`;
        const path = this.generateCode(dir);
        this.logOutput(`Source code with ${message} written to `, path);
    }

    private outlineRegion(wrappedRegion: Statement[], prefix: string): number {
        const start = wrappedRegion[0] as WrapperStmt;
        const end = wrappedRegion[wrappedRegion.length - 1] as WrapperStmt;

        const outliner = new Outliner(true);
        outliner.setDefaultPrefix(prefix);

        const [outFun, outCall] = outliner.outlineWithWrappers(start, end);
        start.detach();
        end.detach();

        if (outFun == undefined || outCall == undefined) {
            this.logError(`  Outlining failed for region at ${start.location}`);
            return 0;
        }

        if (outFun.body.stmts.length === 0) {
            outFun.detach();
            outCall.parent.detach();
            this.log(`  Outlined function "${outFun.name}" is empty; removing it`);
            return 0;
        }
        else {
            this.log(`  Created outlined function "${outFun ? outFun.name : "<unknown>"}"`);
            return 1;
        }
    }

    private filterRegions(regions: Statement[][]): Statement[][] {
        const filteredRegions = [];

        for (const region of regions) {
            const beginWrapper = region[0] as WrapperStmt;
            const endWrapper = region.at(-1) as WrapperStmt;

            if (!(beginWrapper instanceof WrapperStmt) || !(endWrapper instanceof WrapperStmt)) {
                this.logError("  Region does not have proper wrappers; skipping");
                continue;
            }
            const unwrappedRegion = region.slice(1, region.length - 1);

            const validator = new OutlineRegionValidator();
            const [valid, reason] = validator.validate(unwrappedRegion);

            if (valid) {
                filteredRegions.push(region);
            }
            else {
                this.log(`  Region ${beginWrapper.code.split(" ").at(-1)?.trim()} failed criterion ${reason}; skipping`);
                beginWrapper.detach();
                endWrapper.detach();
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
                this.log(`  Found a trivial return with statements "${stmt}" and "${ret}"`);
            }

            return isTrivialReturn;
        }
        return false;
    }

    private findRegionsInScope(scope: Scope): Statement[][] {
        const regions: Statement[][] = [];
        let currRegion: Statement[] = [];

        for (const stmt of scope.children) {
            if (stmt instanceof If) {
                const thenScope = stmt.then;
                const thenOk = !this.hasFunctionCalls(thenScope) || this.isTrivialIf(thenScope);
                const elseScope = stmt.else;
                const elseOk = elseScope == null ? true : !this.hasFunctionCalls(elseScope) || this.isTrivialIf(elseScope);

                if (thenOk && elseOk) {
                    currRegion.push(stmt);
                }
                else {
                    if (currRegion.length > 0) {
                        regions.push(currRegion);
                        currRegion = [];

                        // how to handle an if scope:
                        // if *all* stmts are calls, leave it be
                        // if there's at least one non-call stmt, outline everything and hope the next pass breaks it down
                        const thenIsAllCalls = thenScope.stmts.every(s => this.hasFunctionCalls(s));
                        const elseIsAllCalls = elseScope != null ? elseScope.stmts.every(s => this.hasFunctionCalls(s)) : true;

                        if (!(thenIsAllCalls && elseIsAllCalls)) {
                            regions.push([thenScope.stmts[0], thenScope.stmts[thenScope.stmts.length - 1]]);

                            if (!elseIsAllCalls) {
                                regions.push([elseScope.stmts[0], elseScope.stmts[elseScope.stmts.length - 1]]);
                            }
                        }
                    }
                }
            }
            else if (stmt instanceof Loop) {
                const loopScope = stmt.body;
                const loopOk = !this.hasFunctionCalls(loopScope);

                if (loopOk) {
                    currRegion.push(stmt);
                }
                else {
                    if (currRegion.length > 0) {
                        regions.push(currRegion);
                        currRegion = [];
                    }
                    // outline the loop body as a region if it has non-call statements
                    const lookIsAllCalls = loopScope.stmts.every(s => this.hasFunctionCalls(s));
                    if (!lookIsAllCalls) {
                        regions.push([loopScope.stmts[0], loopScope.stmts[loopScope.children.length - 1]]);
                    }
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
            if (jp == undefined) {
                return false;
            }
            const isValidExternal = ExternalFunctionsMatcher.isValidExternal(jp);
            return !isValidExternal;
        }

        for (const call of Query.searchFrom(jp, Call)) {
            const fun = call.function;
            if (fun == undefined) {
                continue;
            }
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