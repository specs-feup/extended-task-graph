import { Call } from "@specs-feup/clava/api/Joinpoints.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js"
import { AStage } from "../../AStage.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { DefaultSuffix } from "../../api/PreSuffixDefaults.js";
import IdGenerator from "@specs-feup/lara/api/lara/util/IdGenerator.js";

export class ReplicaCreator extends AStage {
    constructor(topFunctionName: string) {
        super("TransFlow-TaskPrep-Replicator", topFunctionName);
    }

    public replicateAll(): [number, number] {
        let isChanging = true;
        let nReplicas = 0;

        while (isChanging) {
            const allFuns = this.getValidFunctions();
            isChanging = false;

            allFuns.forEach((fun) => {
                const calls = Query.search(Call, { signature: fun.signature }).get() as Call[];
                if (calls.length > 1) {
                    calls.forEach((call, idx) => {
                        if (idx > 0) {
                            this.replicate(call);
                        }
                    });
                    this.log(`Replicated function ${fun.name} ${calls.length - 1} time(s)`);
                    isChanging = true;
                    nReplicas += calls.length - 1;
                }
            });
        }
        const allFunsFinal = this.getValidFunctions();
        const nFuns = allFunsFinal.length;
        return [nReplicas, nFuns];
    }

    public replicate(call: Call) {
        const fun = call.function;
        const baseName = `${fun.name}${DefaultSuffix.REPLICA_FUN}`;
        const fullName = IdGenerator.next(baseName);
        const clone = fun.clone(fullName);

        const argList = call.argList;
        const newCall = ClavaJoinPoints.call(clone, ...argList);
        call.replaceWith(newCall);
        return true;
    }
}