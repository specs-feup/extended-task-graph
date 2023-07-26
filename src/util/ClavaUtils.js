"use strict";

laraImport("clava.Clava");

class ClavaUtils {
    static verifySyntax() {
        let valid = true;
        Clava.pushAst();
        try {
            Clava.rebuild();
        }
        catch (e) {
            valid = false;
        }
        Clava.popAst();
        return valid;
    }

    static generateCode(weaveDir, folder) {
        const path = weaveDir + "/" + folder;
        Clava.writeCode(path);
    }

    static matchTemplate(jp, template) {
        const split = template[0].split(" ");
        const type = split[0];
        const cond = split.length == 2 ? split[1] : "none";

        if (!jp.instanceOf(type) && type != "_") {
            return false;
        }
        if (cond == "noassign") {
            if (!jp.instanceOf("binaryOp")) {
                println("[TemplateMatcher] Cannot process condition \"noassign\" on a joinpoint of type " + jp.joinPointType + "; ignoring");
            }
            else {
                if (jp.kind == "assign") {
                    return false;
                }
            }
        }
        if (cond == "assign") {
            if (!jp.instanceOf("binaryOp")) {
                println("[TemplateMatcher] Cannot process condition \"assign\" on a joinpoint of type " + jp.joinPointType + "; ignoring");
            }
            else {
                if (jp.kind != "assign") {
                    return false;
                }
            }
        }

        for (let i = 1; i < template.length; i++) {
            if (!ClavaUtils.matchTemplate(jp.children[i - 1], template[i])) {
                return false;
            }
        }
        return true;
    }

    static getAllUniqueFunctions(topFunction, includeExternals = false) {
        const funs = [];

        funs.push(topFunction);
        const childrenFuns = ClavaUtils.getEligibleFunctionsFrom(topFunction, includeExternals);
        funs.push(...childrenFuns);

        const uniqueFuns = [];
        for (const fun of funs) {
            if (!uniqueFuns.some(elem => elem.signature === fun.signature) && fun) {
                uniqueFuns.push(fun);
            }
        }
        return uniqueFuns;
    }

    static getEligibleFunctionsFrom(parent, includeExternals = false) {
        const funs = [];

        for (const call of Query.searchFrom(parent, "call")) {
            const fun = call.function;
            const valid = includeExternals ? fun : fun.hasDefinition && fun.isImplementation;

            if (valid) {
                funs.push(fun);
                const children = ClavaUtils.getEligibleFunctionsFrom(fun, includeExternals);
                funs.push(...children);
            }
        }
        return funs;
    }

    static functionHasImplementation(fun) {
        return fun.hasDefinition && fun.isImplementation && fun.body.children.length > 0;
    }
}