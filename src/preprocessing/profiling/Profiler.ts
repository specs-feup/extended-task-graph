import { AStage } from "../../AStage.js";
import { FunctionInstrumenter } from "./FunctionInstrumenter.js";
import { LoopIterationInstrumenter } from "./LoopIterationInstrumenter.js";

export class Profiler extends AStage {
    constructor(topFunction: string) {
        super("TransFlow-Profiler", topFunction);
    }

    public instrumentAll(): void {
        const funInst = new FunctionInstrumenter(this.getTopFunctionName());
        const funCount = funInst.instrument();
        this.log(`Instrumented ${funCount} functions with timing guards`);

        const loopInst = new LoopIterationInstrumenter(this.getTopFunctionName(), false);
        const loopCnt = loopInst.instrumentLoopIterations();
        this.log(`Instrumented ${loopCnt} dynamic loops with iteration counters`);
    }
}