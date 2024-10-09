import { Call, FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import IdGenerator from "@specs-feup/lara/api/lara/util/IdGenerator.js";
import { DotSorting } from "../../util/DotSorting.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export class CallTreeDumper {
    #omitOperators: boolean;

    constructor(omitOperators = true) {
        this.#omitOperators = omitOperators;
    }

    dump(topFunction: FunctionJp, rankdir: DotSorting = DotSorting.LEFT_TO_RIGHT): string {
        const topId = IdGenerator.next("F");
        const ret = this.#buildTree(topFunction, topId);
        const nodes = ret[0].join("\n");
        const edges = ret[1].join("\n");

        const dot = `
digraph G {
rankdir=${rankdir.valueOf()};
node [shape=rectangle];

${nodes}

${edges}
}`;
        return dot;
    }

    #buildTree(fun: FunctionJp, id: string): [string[], string[]] {
        if (fun == undefined) {
            return [[], []];
        }
        const name = fun.name;
        if (this.#omitOperators && this.#isCppOperator(name)) {
            return [[], []];
        }

        const style = fun.isImplementation ? "filled" : "dotted";
        const node = `${id} [label="${name}", style=${style}];`;

        const nodes = [node];
        const edges = [];

        let i = 0;
        for (const call of Query.searchFrom(fun, Call)) {
            const targetId = IdGenerator.next("F");
            const targetFun = call.function;
            const res = this.#buildTree(targetFun, targetId);

            const childNodes = res[0];
            const childEdges = res[1];

            nodes.push(...childNodes);
            edges.push(...childEdges);

            if (childNodes.length > 0) {
                edges.push(`${id} -> ${targetId} [label=${i}];`);
                i++;
            }
        }
        return [nodes, edges];
    }

    #isCppOperator(str: string) {
        const cppOperatorRegex = /^operator(?:\+\+|--|>>|<<|\|\||&&|[-+*\/%^&|=<>!]=?|~|\.|\->|\(|\)|\[|\]|\{|}|,|;|:|\?|\#|@|::)$/;
        return cppOperatorRegex.test(str);
    }
}