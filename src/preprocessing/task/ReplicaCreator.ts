import { Call } from "@specs-feup/clava/api/Joinpoints.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js"
import { AStage } from "../../AStage.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export class ReplicaCreator extends AStage {
    constructor(topFunctionName: string) {
        super("TransFlow-TaskPrep-Replicator", topFunctionName);
    }

    public replicateAll(): [number, number] {
        let nReplicas = 0, nUnique = 0;

        for (let i = 0; i < 99; i++) {
            const [rep, uniq] = this.doPass();

            nReplicas += rep;
            nUnique += uniq;

            if (rep == 0) {
                break;
            }
        }
        return [nReplicas, nUnique];
    }

    public doPass(): [number, number] {
        const instances: Map<string, Call[]> = this.findReplicas();

        if (instances.size == 0) {
            this.log("Found no replicable functions");
            return [0, 0];
        }
        else {
            this.log(`Found ${instances.size} replicable functions`);
        }

        let nReplicas = 0, nUnique = 0;

        for (const key of instances.keys()) {
            const calls = instances.get(key)!;
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

    public findReplicas(): Map<string, Call[]> {
        const topFun = this.getTopFunctionJoinPoint();
        const uniqueFuns = ClavaUtils.getAllUniqueFunctions(topFun);
        const uniqueFunNames = uniqueFuns.map(fun => fun.name);

        const instances: Map<string, Call[]> = new Map();

        for (const uniqueFun of uniqueFuns) {
            for (const call of Query.searchFrom(uniqueFun, Call)) {
                const callName = call.name;
                if (!uniqueFunNames.includes(callName)) {
                    continue;
                }

                if (!instances.has(callName)) {
                    instances.set(callName, [call]);
                } else {
                    instances.get(callName)!.push(call);
                }
            }

            for (const key of instances.keys()) {
                if (instances.get(key)!.length == 1) {
                    instances.delete(key);
                }
            }
        }
        return instances;
    }

    public createReplicas(calls: Call[]): number {
        const fun = calls[0].function;

        let id = 0;
        for (const call of calls) {
            const success = this.replicate(call, id);
            if (success) {
                id++;
            }
        }
        fun.detach();

        return id;
    }

    public replicate(call: Call, id: number) {
        const fun = call.function;
        const clone = fun.clone(`${fun.name}_rep${id}`);

        const argList = call.argList;
        const newCall = ClavaJoinPoints.call(clone, ...argList);
        call.replaceWith(newCall);
        return true;
    }
}