"use strict";

laraImport("clava.ClavaJoinPoints");
laraImport("weaver.Query");
laraImport("flextask/util/ClavaUtils");

class ReplicaCreator {

    findReplicas(topFunction) {
        const uniqueFuns = ClavaUtils.getAllUniqueFunctions(topFunction);
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
        return false;
    }
}