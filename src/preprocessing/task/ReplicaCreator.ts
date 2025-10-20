import { Call, FileJp, FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js"
import { AStage } from "../../AStage.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { DefaultSuffix } from "../../api/PreSuffixDefaults.js";
import IdGenerator from "@specs-feup/lara/api/lara/util/IdGenerator.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";

export class ReplicaCreator extends AStage {
    private readonly regex: RegExp = new RegExp(`${DefaultSuffix.REPLICA_FUN.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&')}([0-9]\\d*)$`);

    constructor(topFunctionName: string) {
        super("TransFlow-TaskPrep-Replicator", topFunctionName);
    }

    public replicateAll(): [number, number] {
        const nUnique = this.getValidFunctions().length;
        let nReplicas = 0;
        let isChanging = true;

        while (isChanging) {
            isChanging = false;

            const funs = ClavaUtils.getEligibleFunctionsFrom(this.getTopFunctionJoinPoint(), false);
            const funCount = new Map<string, number>();
            funs.forEach((fun) => {
                const sig = fun.signature;
                const count = funCount.get(sig) ?? 0;
                funCount.set(sig, count + 1);
            });

            for (const [signature, count] of funCount) {
                if (count <= 1) {
                    continue;
                }
                this.log(`Replicating function ${signature.split("(")[0]}`);

                const calls = Query.search(Call, { signature: signature }).get();
                for (const call of calls) {
                    const changed = this.replicate(call);
                    if (changed) {
                        isChanging = true;
                        nReplicas += 1;
                    }
                }
            }
        }
        this.rebuildDeclarations();
        return [nReplicas, nUnique];
    }

    public replicate(call: Call): boolean {
        const fun = call.function;
        const suffix = DefaultSuffix.REPLICA_FUN;
        const baseName = this.regex.test(fun.name) ? fun.name.replace(this.regex, '') : fun.name;
        const suffixedName = `${baseName}${suffix}`;

        const fullName = IdGenerator.next(suffixedName);
        const clone = fun.clone(fullName);

        const argList = call.argList;
        const newCall = ClavaJoinPoints.call(clone, ...argList);
        call.replaceWith(newCall);

        this.log(`  Created replica function ${fullName}`);
        return true;
    }

    private rebuildDeclarations(): void {
        this.log("Rebuilding function declarations...");

        for (const fun of Query.search(FunctionJp, { isImplementation: false })) {
            if (this.regex.test(fun.name)) {
                fun.detach();
            }
        }

        for (const fun of Query.search(FunctionJp, { isImplementation: true })) {
            if (this.regex.test(fun.name)) {
                const newDecl = ClavaJoinPoints.functionDecl(fun.name, fun.returnType, ...fun.params);
                const file = fun.getAncestor("file") as FileJp;
                file.insertBegin(newDecl);
            }
        }
        this.log("Done rebuilding function declarations.");
    }
}