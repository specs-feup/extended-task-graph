import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { ArrayAccess, BinaryOp, Call, FunctionJp, Joinpoint, ParenExpr, PointerType, UnaryOp, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import Io from "@specs-feup/lara/api/lara/Io.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export class ClavaUtils {
    public static verifySyntax(): boolean {
        let valid = true;
        Clava.pushAst();
        try {
            Clava.rebuild();
        }
        catch (e: unknown) {
            console.log(e);
            valid = false;
        }
        Clava.popAst();
        return valid;
    }

    public static generateCode(weaveDir: string, folder: string): string {
        const path = weaveDir + "/" + folder;

        //ClavaUtils.verifySyntax();

        Io.deleteFolderContents(path);
        Clava.writeCode(path);
        return path;
    }

    // The template matcher needs to be rewritten from scratch,
    // so we'll facilitate and use a little "any" type for now
    public static matchTemplate(jp: Joinpoint, template: (string | any)[]): boolean {
        const split = template[0].split(" ") as string;
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

    public static getAllUniqueFunctions(topFunction: FunctionJp, includeExternals = false): FunctionJp[] {
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

    public static functionHasImplementation(fun: FunctionJp): boolean {
        if (fun.name.startsWith("operator")) {
            return false;
        }
        return fun.isImplementation && fun.body.children.length > 0;
    }

    public static getDatatypeSize(datatype: string): number {
        const cDataTypes = new Map([
            ['char', 1],
            ['unsigned char', 1],
            ['signed char', 1],
            ['short', 2],
            ['unsigned short', 2],
            ['int', 4],
            ['unsigned int', 4],
            ['long', 4],            // Size may vary on different platforms
            ['unsigned long', 4],   // Size may vary on different platforms
            ['long long', 8],
            ['unsigned long long', 8],
            ['float', 4],
            ['double', 8],
            ['long double', 16],    // Size may vary on different platforms
        ]);

        const trimmedType = datatype.trim();
        const formattedType = trimmedType.replace(/\s+/g, ' ');

        const size = cDataTypes.get(formattedType);
        if (size === undefined) {
            return 4;
        }
        return size;
    }
}