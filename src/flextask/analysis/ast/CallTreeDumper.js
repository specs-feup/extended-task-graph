"use strict";

laraImport("weaver.Query");
laraImport("lara.util.IdGenerator");

class CallTreeDumper {
    #omitOperators;

    constructor(omitOperators = true) {
        this.#omitOperators = omitOperators;
    }

    dump(topFunction, rankdir = "LR") {
        const topId = IdGenerator.next("F");
        const ret = this.#buildTree(topFunction, topId);
        const nodes = ret[0].join("\n");
        const edges = ret[1].join("\n");

        const dot = `
digraph G {
rankdir=${rankdir};
node [shape=rectangle];

${nodes}

${edges}
}`;
        return dot;
    }

    #buildTree(fun, id) {
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
        for (const call of Query.searchFrom(fun, "call")) {
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

    #isCppOperator(str) {
        const cppOperatorRegex = /^operator(?:\+\+|--|>>|<<|\|\||&&|[-+*\/%^&|=<>!]=?|~|\.|\->|\(|\)|\[|\]|\{|}|,|;|:|\?|\#|@|::)$/;
        return cppOperatorRegex.test(str);
    }
}