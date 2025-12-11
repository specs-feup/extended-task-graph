import { Call, FileJp, FunctionJp, Loop } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import IdGenerator from "@specs-feup/lara/api/lara/util/IdGenerator.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { EtgLogger } from "@specs-feup/extended-task-graph/EtgLogger";

export class InstrumentationInserter {
    private logger: EtgLogger;

    constructor(outputDir: string, appName: string) {
        this.logger = new EtgLogger("InstrInserter", outputDir, appName, "Hoopa");
    }

    public instrumentLoops(fun: FunctionJp): number {
        this.logger.log(`Instrumenting loops in ${fun.name}`);
        let loopCount = 0;

        // file pointer declared just before the function
        const fopenDeclStr = `FILE* ${fun.name}_fptr;`;
        const fopenDeclStmt = ClavaJoinPoints.stmtLiteral(fopenDeclStr);
        fun.insertBefore(fopenDeclStmt);

        // init file at the beginning of the function
        const fopenStr = `${fun.name}_fptr = fopen("loop_counts_${fun.name}.csv", "w");`;
        const fopenStmt = ClavaJoinPoints.stmtLiteral(fopenStr);
        fun.body.insertBegin(fopenStmt);

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
            const fprintfStr = `fprintf(${fun.name}_fptr, "${fun.name}:${loop.line},%d\\n", ${loopCounterName});`;
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