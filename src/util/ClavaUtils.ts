import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { ArrayAccess, BinaryOp, Call, FunctionJp, Joinpoint, PointerType, UnaryExprOrType, UnaryOp, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import Io from "@specs-feup/lara/api/lara/Io.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export class ClavaUtils {
    public static verifySyntax() {
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

    public static generateCode(weaveDir: string, folder: string) {
        const path = weaveDir + "/" + folder;

        Io.deleteFolderContents(path);
        Clava.writeCode(path);
        return path;
    }

    // The template matcher needs to be rewritten from scratch,
    // so we'll facilitate and use a little "any" type for now
    public static matchTemplate(jp: Joinpoint, template: any) {
        const split = template[0].split(" ");
        const type = split[0];
        const cond = split.length == 2 ? split[1] : "none";

        if (!jp.instanceOf(type) && type != "_") {
            return false;
        }
        if (cond == "noassign") {
            if (!(jp instanceof BinaryOp)) {
                console.log("[TemplateMatcher] Cannot process condition \"noassign\" on a joinpoint of type " + jp.joinPointType + "; ignoring");
            }
            else {
                if (jp.kind == "assign") {
                    return false;
                }
            }
        }
        if (cond == "assign") {
            if (!(jp instanceof BinaryOp)) {
                console.log("[TemplateMatcher] Cannot process condition \"assign\" on a joinpoint of type " + jp.joinPointType + "; ignoring");
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

    public static getAllUniqueFunctions(topFunction: FunctionJp, includeExternals = false) {
        const funs = [];

        funs.push(topFunction);
        const childrenFuns = ClavaUtils.getEligibleFunctionsFrom(topFunction, includeExternals);
        funs.push(...childrenFuns);

        const uniqueFuns: FunctionJp[] = [];
        for (const fun of funs) {
            if (!uniqueFuns.some(elem => elem.signature === fun.signature) && fun) {
                uniqueFuns.push(fun);
            }
        }
        return uniqueFuns;
    }

    public static getEligibleFunctionsFrom(parent: Joinpoint, includeExternals = false): FunctionJp[] {
        const funs: FunctionJp[] = [];

        for (const call of Query.searchFrom(parent, Call)) {
            const fun = call.function;
            if (fun == undefined) {
                continue;
            }
            const valid = includeExternals ? fun : fun.isImplementation;

            if (valid) {
                funs.push(fun);
                const children = ClavaUtils.getEligibleFunctionsFrom(fun, includeExternals);
                funs.push(...children);
            }
        }
        return funs;
    }

    public static functionHasImplementation(fun: FunctionJp) {
        if (fun.name.startsWith("operator")) {
            return false;
        }
        return fun.isImplementation && fun.body.children.length > 0;
    }

    public static isDef(varref: Varref) {
        if (varref.parent instanceof BinaryOp) {
            const binOp = varref.parent;
            return binOp.kind == "assign" && binOp.left.code == varref.code;
        }
        if (varref.parent instanceof ArrayAccess) {
            const arrAccess = varref.parent;

            if (arrAccess.parent instanceof BinaryOp) {
                const binOp = arrAccess.parent;
                return binOp.kind == "assign" && binOp.left.code == arrAccess.code;
            }
            if (arrAccess.parent instanceof Vardecl) {
                return arrAccess.numChildren > 1;
            }
        }
        if (varref.type instanceof PointerType) {
            const parent = varref.parent;
            const grandparent = parent.parent;

            const cond1 = parent instanceof UnaryOp && parent.kind == "deref";
            if (cond1) {
                const cond2 = grandparent instanceof BinaryOp && grandparent.kind == "assign";
                if (cond2) {
                    return grandparent.left.code == parent.code;
                }
            }
        }

        return false;
    }

    public static getDatatypeSize(datatype: string) {
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