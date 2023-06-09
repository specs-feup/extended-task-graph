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

    #buildLabel(key, val) {
        return "  {" + key + ": " + val + "}";
    }

    #dumpJoinPoint(jp, indent) {
        var str = jp.joinPointType;
        if (jp.instanceOf(["param", "vardecl"])) {
            str += this.#buildLabel("name", jp.name) + this.#buildLabel("type", jp.type.joinPointType);
        }
        if (jp.instanceOf(["unaryOp", "binaryOp"])) {
            str += this.#buildLabel("kind", jp.kind);
        }
        if (jp.instanceOf("call")) {
            str += this.#buildLabel("fun", jp.name);
        }
        if (jp.instanceOf("function")) {
            str += this.#buildLabel("sig", jp.signature);
        }
        this.#addLevelToResult(str, indent);

        if (jp.children.length > 4) {
            var allLits = true;
            for (const child of jp.children) {
                if (!child.instanceOf("intLiteral")) {
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