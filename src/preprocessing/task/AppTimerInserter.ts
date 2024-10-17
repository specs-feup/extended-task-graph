import { Call } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import Timer from "@specs-feup/clava/api/lara/code/Timer.js";
import { TimerUnit } from "@specs-feup/lara/api/lara/util/TimeUnits.js";

export class AppTimerInserter {
    constructor() { }

    public insertTimer(topFunction: string, filename: string = "app_exec_time.csv"): boolean {
        if (topFunction == "main") {
            return false;
        }
        else {
            for (const call of Query.search(Call)) {
                if (call.function.name == topFunction) {
                    this.insertTimerAroundCall(call, filename);
                }
            }
            return true;
        }
    }

    private insertTimerAroundCall(call: Call, filename: string): void {
        const timer = new Timer(TimerUnit.MICROSECONDS, filename);
        timer.time(call);
    }
}