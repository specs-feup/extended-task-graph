import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { BinaryOp, Call, FunctionJp, IntLiteral, Joinpoint, MemberAccess, Param, UnaryOp, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";

export abstract class AstDumper {
    constructor() { }

    public dump(startJp?: Joinpoint): string {
        if (startJp === undefined) {
            startJp = Clava.getProgram();
        }
        let currentRes = "";

        currentRes += this.levelPrologue();

        currentRes += this.levelEntry(startJp.joinPointType, 0);
        for (const child of startJp.children) {
            currentRes += this.levelPrologue();
            currentRes += this.dumpJoinPoint(child, 1);
            currentRes += this.levelEpilogue();
        }

        currentRes += this.levelEpilogue();

        return currentRes;
    }

    private dumpJoinPoint(jp: Joinpoint, indent: number): string {
        let ast = "";
        const jpName = jp.joinPointType;
        const props: Record<string, string> = {};

        if (jp instanceof Param || jp instanceof Vardecl || jp instanceof Varref || jp instanceof MemberAccess) {
            props.name = jp.name;
            props.type = jp.type.joinPointType;
        }

        if (jp instanceof UnaryOp || jp instanceof BinaryOp) {
            props.kind = jp.kind;
        }

        if (jp instanceof Call) {
            props.function = jp.name;
        }

        if (jp instanceof FunctionJp) {
            props.sig = jp.signature;
        }
        const propsStr = Object.keys(props).length == 0 ? "" :
            Object.entries(props).map(([key, val]) => `${key}: ${val}`).join(", ");

        const str = `${jpName} {${propsStr}}`;
        ast += this.levelEntry(str, indent);

        if (jp.children.length > 4) {
            let allLits = true;
            for (const child of jp.children) {
                if (!(child instanceof IntLiteral)) {
                    allLits = false;
                }
            }
            if (allLits) {
                ast += this.levelPrologue();
                ast += this.levelEntry(jp.joinPointType + " (" + jp.children.length + "x)", indent + 2);
                ast += this.levelEpilogue();
                return ast;
            }
        }
        for (const child of jp.children) {
            ast += this.levelPrologue();
            ast += this.dumpJoinPoint(child, indent + 1);
            ast += this.levelEpilogue();
        }
        return ast;
    }

    public abstract getFileExtension(): string;

    protected abstract levelEntry(label: string, indent: number): string;

    protected abstract levelPrologue(): string;

    protected abstract levelEpilogue(): string;
}