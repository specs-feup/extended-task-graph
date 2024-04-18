"use strict";

laraImport("clava.ClavaJoinPoints");
laraImport("weaver.Query");
laraImport("flextask/AStage");
laraImport("flextask/util/ClavaUtils");

class ReplicaCreator extends AStage {
    constructor(topFunctionName) {
        super("CTFlow-TaskPrep-Replicator", topFunctionName);
    }

    replicateAll() {
        const replicas = this.findReplicas();

        if (Object.keys(replicas).length == 0) {
            this.log("Found no replicable functions");
            return;
        }
        else {
            this.log(`Found ${Object.keys(replicas).length} replicable functions`);
        }

        let nReplicas = 0, nUnique = 0;
        for (const key in replicas) {
            const calls = replicas[key];
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

    findReplicas() {
        const topFun = this.getTopFunctionJoinPoint();
        const uniqueFuns = ClavaUtils.getAllUniqueFunctions(topFun);
        const uniqueFunNames = uniqueFuns.map(fun => fun.name);
        const replicas = {};

        for (const call of Query.search("call")) {
            const name = call.name;
            if (!uniqueFunNames.includes(name)) {
                continue;
            }

            if (replicas[name] == null) {
                replicas[name] = [call];
            }
            else {
                replicas[name].push(call);
            }
        }

        for (const key in replicas) {
            if (replicas[key].length == 1) {
                delete replicas[key];
            }
        }
        return replicas;
    }

    createReplicas(calls) {
        return 0;
    }
}