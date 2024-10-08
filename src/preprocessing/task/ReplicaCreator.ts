import { Call } from "@specs-feup/clava/api/Joinpoints.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js"
import { AStage } from "../../AStage.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export class ReplicaCreator extends AStage {
    constructor(topFunctionName: string) {
        super("CTFlow-TaskPrep-Replicator", topFunctionName);
    }

    replicateAll(): [number, number] {
        const replicas: Map<string, Call[]> = this.findReplicas();

        if (Object.keys(replicas).length == 0) {
            this.log("Found no replicable functions");
            return [0, 0];
        }
        else {
            this.log(`Found ${Object.keys(replicas).length} replicable functions`);
        }

        let nReplicas = 0, nUnique = 0;
        for (const key in replicas) {
            const calls = replicas.get(key)!;
            const nCalls = calls.length;
            const name = calls[0].name;
            this.log(`Found ${nCalls} call sites for function ${name}`);

            const res = this.createReplicas(calls);
            if (res > 0) {
                this.log(`Created ${res} replicas for function ${name}`);
                nReplicas += res;
                nUnique++;
            }
            else {
                this.log(`Could not create replicas for function ${name}`);
            }
        }
        return [nReplicas, nUnique];
    }

    findReplicas(): Map<string, Call[]> {
        const topFun = this.getTopFunctionJoinPoint();
        const uniqueFuns = ClavaUtils.getAllUniqueFunctions(topFun);
        const uniqueFunNames = uniqueFuns.map(fun => fun.name);
        const replicas: Map<string, Call[]> = new Map();

        for (const uniqueFun of uniqueFuns) {
            for (const call of Query.searchFrom(uniqueFun, Call)) {
                const name = call.name;
                if (!uniqueFunNames.includes(name)) {
                    continue;
                }

                if (replicas.get(name) == null) {
                    replicas.set(name, [call]);
                }
                else {
                    replicas.get(name)!.push(call);
                }
            }
        }

        for (const key of replicas.keys()) {
            if (replicas.get(key)!.length == 1) {
                replicas.delete(key);
            }
        }
        return replicas;
    }

    createReplicas(calls: Call[]): number {
        let id = 0;
        for (const call of calls) {
            const success = this.replicate(call, id);
            if (success) {
                id++;
            }
        }
        return id;
    }

    replicate(call: Call, id: number) {
        const fun = call.function;
        const clone = fun.clone(`${fun.name}_rep${id}`);

        const argList = call.argList;
        const newCall = ClavaJoinPoints.call(clone, ...argList);
        call.replaceWith(newCall);
        return true;
    }
}