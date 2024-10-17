import LoopCharacterizer, { LoopCharacterization } from "clava-code-transformations/LoopCharacterizer";
import { AStage } from "../../AStage.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Loop } from "@specs-feup/clava/api/Joinpoints.js";
import IdGenerator from "@specs-feup/lara/api/lara/util/IdGenerator.js";


export class LoopIterationInstrumenter extends AStage {
    private iterationsCsv: string;

    constructor(topFunction: string, iterationsCsv: string = "loop_iterations.csv") {
        super("TransFlow-Profiler-LoopIterInst", topFunction);
        this.iterationsCsv = iterationsCsv;
    }

    public instrumentLoopIterations(): number {
        let cnt = 0;

        for (const loop of Query.search(Loop)) {
            const characterizer = new LoopCharacterizer();
            const props = characterizer.characterize(loop);
            if (props.tripCount == -1) {
                this.instrumentLoop(loop, props);
                cnt++;
            }
        }
        return cnt;
    }

    private instrumentLoop(loop: Loop, props: LoopCharacterization): void {
        const counterName = IdGenerator.next("__iterCounter");
        const preStmt = `int ${counterName} = 0;`;

        const bodyStmt = `${counterName}++;`;

        const outputFileVarName = IdGenerator.next("__loopIterationsFile");
        const postStmts = [
            `FILE * ${outputFileVarName};`,
            `${outputFileVarName} = fopen("${this.iterationsCsv}", "a");`,
            `fprintf(${outputFileVarName}, "${loop.location},%d\n", __iterCounter)`,
            `fclose(${outputFileVarName});`
        ];

        // Missing: insert statements
    }
}
