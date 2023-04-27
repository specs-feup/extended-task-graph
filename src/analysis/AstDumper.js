"use strict";

laraImport("weaver.Query");

class AstDumper {
    #currentRes = "";

    constructor() { }

    dump() {
        this.#currentRes = "";

        for (const startJp of Query.search("file")) {
            this.#addLevelToResult(startJp.joinPointType);

            for (const child of startJp.children) {
                this.#dumpJoinPoint(child, 1);
            }
        }
        return this.#currentRes.slice();
    }

    #dumpJoinPoint(jp, indent) {
        var str = jp.joinPointType;
        if (jp.joinPointType == "param") {
            str += " type: " + jp.type;
        }
        if (jp.joinPointType == "unaryOp") {
            str += " kind: " + jp.kind;
        }
        this.#addLevelToResult(str, indent);

        if (jp.children.length > 20) {
            var allLits = true;
            for (const child of jp.children) {
                if (child.joinPointType != "intLiteral") {
                    allLits = false;
                }
            }
            if (allLits) {
                this.#addLevelToResult(jp.joinPointType + " (" + jp.children.length + "x)", indent + 2);
                return;
            }
        }
        for (const child of jp.children) {
            this.#dumpJoinPoint(child, indent + 2);
        }
    }

    #addLevelToResult(str, indent) {
        this.#currentRes += ' '.repeat(indent + 2) + str + "\n";
    }
}