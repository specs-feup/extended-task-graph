import { Call, FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import Timer from "@specs-feup/clava/api/lara/code/Timer.js";
import { TimerUnit } from "@specs-feup/lara/api/lara/util/TimeUnits.js";

export class AppTimerInserter {
    constructor() { }

    public insertTimer(topFunction: FunctionJp, filename: string = "app_exec_time.csv"): boolean {
        if (topFunction.name == "main") {
            return false;
        }
        else {
            for (const call of Query.search(Call, { name: topFunction.name })) {
                this.insertTimerAroundCall(call, filename);
            }
            return true;
        }
    }

    private insertTimerAroundCall(call: Call, filename: string): void {
        const timer = new Timer(TimerUnit.MICROSECONDS, filename);
        timer.time(call);
    }
}