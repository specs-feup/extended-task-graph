import { Call, FileJp, FunctionJp, Loop, ReturnStmt } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import IdGenerator from "@specs-feup/lara/api/lara/util/IdGenerator.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { EtgLogger } from "@specs-feup/extended-task-graph/EtgLogger";

export class InstrumentationInserter {
    private logger: EtgLogger;

    constructor(outputDir: string, appName: string) {
        this.logger = new EtgLogger("InstrInserter", outputDir, appName, "ETG");
    }

    public createLoopsInstrumentationFile(): void {
        const main = Query.search(FunctionJp, (f) => f.name == "main" && f.isImplementation).get().at(0);
        if (!main) {
            this.logger.logError("Main function not found for loops instrumentation.");
            return;
        }

        // include stdio.h in main file
        const mainFile = main.getAncestor("file") as FileJp;
        mainFile.addInclude("stdio.h", true);

        // declare file pointer at the beginning of main
        const filePtrDeclStr = `FILE* loops_fptr;`;
        const filePtrDeclStmt = ClavaJoinPoints.stmtLiteral(filePtrDeclStr);
        Query.searchFrom(mainFile, FunctionJp).get().at(0)!.insertBefore(filePtrDeclStmt);

        // add extern declaration of file pointer to other files
        for (const file of Query.search(FileJp, (f) => f.name.endsWith(".c") && f.name != mainFile.name).get()) {
            const filePtrDeclStr = `extern FILE* loops_fptr;`;
            const filePtrDeclStmt = ClavaJoinPoints.stmtLiteral(filePtrDeclStr);
            const firstFun = Query.searchFrom(file, FunctionJp).get().at(0);
            if (firstFun) {
                firstFun.insertBefore(filePtrDeclStmt);
            }
            else {
                file.insertEnd(filePtrDeclStmt);
            }
            file.addInclude("stdio.h", true);
        }

        // open file in main
        const fopenStr = `loops_fptr = fopen("loop_counts.csv", "w");`;
        const fopenStmt = ClavaJoinPoints.stmtLiteral(fopenStr);
        main.body.insertBegin(fopenStmt);

        // close file on every return in main
        // (this ignores any early exits via exit() calls)
        for (const ret of Query.searchFrom(main, ReturnStmt).get()) {
            const fcloseStr = `fclose(loops_fptr);`;
            const fcloseStmt = ClavaJoinPoints.stmtLiteral(fcloseStr);
            ret.insertBefore(fcloseStmt);
        }
        this.logger.log("Created loops instrumentation file in main function.");
    }

    public instrumentLoops(fun: FunctionJp): number {
        this.logger.log(`Instrumenting loops in ${fun.name}`);
        let loopCount = 0;

        for (const loop of Query.searchFrom(fun, Loop)) {
            this.logger.log(`  Instr. loop at ${fun.name}:${loop.line}`);

            // declare loop counter before the loop
            const loopCounterName = IdGenerator.next("_loop_cntr_")
            const literalZero = ClavaJoinPoints.integerLiteral(0);
            const loopCounterDecl = ClavaJoinPoints.varDecl(loopCounterName, literalZero);
            const declStmt = ClavaJoinPoints.declStmt(loopCounterDecl);
            loop.insertBefore(declStmt);

            // write loop count to file after the loop
            const incrementExpr = ClavaJoinPoints.unaryOp("post_inc", loopCounterDecl.varref());
            const incrementStmt = ClavaJoinPoints.exprStmt(incrementExpr);
            loop.body.insertBegin(incrementStmt);

            // write to file after the loop
            const fprintfStr = `fprintf(loops_fptr, "${fun.name}:${loop.line},%d\\n", ${loopCounterName});`;
            const fprintfStmt = ClavaJoinPoints.stmtLiteral(fprintfStr);
            loop.insertAfter(fprintfStmt);

            loopCount++;
        }
        return loopCount;
    }

    public instrumentMallocs(): number {
        this.logger.log(`Instrumenting malloc calls in the program`);

        const main = Query.search(FunctionJp, (f) => f.name == "main" && f.isImplementation).first();
        if (!main) {
            this.logger.logError("Main function not found for malloc instrumentation.");
            return 0;
        }
        const mainFileName = (main.getAncestor("file") as FileJp).name;

        // add extern declaration of file pointer to other files
        for (const file of Query.search(FileJp, (f) => f.name.endsWith(".c"))) {
            const isMainFile = file.name == mainFileName;

            const filePtrDeclStr = `${isMainFile ? "" : "extern "}FILE* malloc_fptr;`;
            const filePtrDeclStmt = ClavaJoinPoints.stmtLiteral(filePtrDeclStr);
            const firstFun = Query.searchFrom(file, FunctionJp).first();
            if (firstFun) {
                firstFun.insertBefore(filePtrDeclStmt);
            }
            else {
                file.insertEnd(filePtrDeclStmt);
            }
            file.addInclude("stdio.h", true);
        }

        // open file in main
        const fopenStr = `malloc_fptr = fopen("malloc_sizes.csv", "w");`;
        const fopenStmt = ClavaJoinPoints.stmtLiteral(fopenStr);
        main.body.insertBegin(fopenStmt);

        let mallocCount = 0;
        for (const malloc of Query.search(Call, { name: "malloc" })) {
            this.logger.log(`  Instr. malloc at ${malloc.function!.name}:${malloc.line}`);
            const sizeArg = malloc.args[0];

            const fprintfStr = `fprintf(malloc_fptr, "${malloc.function!.name}:${malloc.line},%zu\\n", ${sizeArg.code});`;
            const fprintfStmt = ClavaJoinPoints.stmtLiteral(fprintfStr);
            malloc.getAncestor("statement").insertAfter(fprintfStmt);
            mallocCount++;
        }
        return mallocCount;
    }

}