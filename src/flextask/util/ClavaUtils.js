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

        Io.deleteFolderContents(path);
        Clava.writeCode(path);
        return path;
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
            if (fun == undefined) {
                continue;
            }
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
        if (fun.name.startsWith("operator")) {
            return false;
        }
        return fun.hasDefinition && fun.isImplementation && fun.body.children.length > 0;
    }

    static isDef(varref) {
        if (varref.parent.instanceOf("binaryOp")) {
            const binOp = varref.parent;
            return binOp.kind == "assign" && binOp.left.code == varref.code;
        }
        if (varref.parent.instanceOf("arrayAccess")) {
            const arrAccess = varref.parent;

            if (arrAccess.parent.instanceOf("binaryOp")) {
                const binOp = arrAccess.parent;
                return binOp.kind == "assign" && binOp.left.code == arrAccess.code;
            }
            if (arrAccess.parent.instanceOf("vardecl")) {
                return arrAccess.numChildren > 1;
            }
        }
        if (varref.type.instanceOf("pointerType")) {
            const parent = varref.parent;
            const grandparent = parent.parent;

            const cond1 = parent.instanceOf("unaryOp") && parent.kind == "deref";
            if (cond1) {
                const cond2 = grandparent.instanceOf("binaryOp") && grandparent.kind == "assign";
                if (cond2) {
                    return grandparent.left.code == parent.code;
                }
            }
        }

        return false;
    }

    static getDatatypeSize(datatype) {
        const cDataTypes = new Map([
            ['char', 1],
            ['unsigned char', 1],
            ['signed char', 1],
            ['short', 2],
            ['unsigned short', 2],
            ['int', 4],
            ['unsigned int', 4],
            ['long', 4], // Size may vary on different platforms
            ['unsigned long', 4], // Size may vary on different platforms
            ['long long', 8],
            ['unsigned long long', 8],
            ['float', 4],
            ['double', 8],
            ['long double', 16], // Size may vary on different platforms
        ]);

        const trimmedType = datatype.trim();
        const formattedType = trimmedType.replace(/\s+/g, ' ');

        const size = cDataTypes.get(formattedType);
        if (size === undefined) {
            //println("Unknown datatype " + datatype + "; returning 4");
            return 4;
        }
        return size;
    }
}