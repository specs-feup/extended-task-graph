import { LoopCharacterizer, LoopCharacterization } from "@specs-feup/clava-code-transforms/LoopCharacterizer";
import { AStage } from "../../AStage.js";
import { Loop, Scope } from "@specs-feup/clava/api/Joinpoints.js";
import IdGenerator from "@specs-feup/lara/api/lara/util/IdGenerator.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";


export class LoopIterationInstrumenter extends AStage {
    private iterationsCsv: string;
    private onlyDynamic: boolean;

    constructor(topFunction: string, onlyDynamic: boolean = true, iterationsCsv: string = "loop_iterations.csv") {
        super("TransFlow-Profiler-LoopIterInst", topFunction);
        this.iterationsCsv = iterationsCsv;
        this.onlyDynamic = onlyDynamic;
    }

    public instrumentLoopIterations(): number {
        let cnt = 0;

        for (const fun of ClavaUtils.getAllUniqueFunctions(this.getTopFunctionJoinPoint())) {
            const funName = fun.name;
            cnt += this.instrumentAllInScope(fun.body, funName, funName);
        }
        return cnt;
    }

    private instrumentAllInScope(scope: Scope, funName: string, prevId: string): number {
        let cnt = 0;
        for (const stmt of scope.children) {
            if (stmt instanceof Loop) {
                cnt++;
                const loop = stmt as Loop;

                const characterizer = new LoopCharacterizer();
                const props = characterizer.characterize(stmt);

                if (props.tripCount == -1 || !this.onlyDynamic) {
                    this.instrumentLoop(stmt, props, `${prevId}-${cnt}`);
                }
                const loopBody = loop.body;
                this.instrumentAllInScope(loopBody, funName, `${prevId}-${cnt}`);
            }
        }
        return cnt;
    }

    private instrumentLoop(loop: Loop, props: LoopCharacterization, id: string): void {
        const counterName = IdGenerator.next("__iterCounter");
        const preStmt = `int ${counterName} = 0;`;

        const bodyStmt = `${counterName}++;`;

        const outputFileVarName = IdGenerator.next("__loopIterationsFile");
        const postStmts = [
            `FILE * ${outputFileVarName};`,
            `${outputFileVarName} = fopen("${this.iterationsCsv}", "a");`,
            `fprintf(${outputFileVarName}, "${id},%d\\n", ${counterName});`,
            `fclose(${outputFileVarName});`
        ];

        loop.insertBefore(preStmt);

        const body = loop.body;
        body.lastChild.insertAfter(bodyStmt);

        for (const stmt of postStmts.reverse()) {
            loop.insertAfter(stmt);
        }
    }
}
