import { BinaryOp, Call, FileJp, FunctionJp, IntLiteral, Joinpoint, MemberAccess, Param, UnaryOp, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export class AstDumper {
    private currentRes: string = "";

    constructor() { }

    public dump(): string {
        this.currentRes = "";

        for (const startJp of Query.search(FileJp)) {
            this.addLevelToResult(startJp.joinPointType, 0);

            for (const child of startJp.children) {
                this.dumpJoinPoint(child, 1);
            }
        }
        return this.currentRes.slice();
    }

    private buildLabel(key: string, val: string): string {
        return "  {" + key + ": " + val + "}";
    }

    private dumpJoinPoint(jp: Joinpoint, indent: number): void {
        var str = jp.joinPointType;

        if (jp instanceof Param || jp instanceof Vardecl || jp instanceof Varref || jp instanceof MemberAccess) {
            str += this.buildLabel("name", jp.name) + this.buildLabel("type", jp.type.joinPointType);
        }

        if (jp instanceof UnaryOp || jp instanceof BinaryOp) {
            str += this.buildLabel("kind", jp.kind);
        }

        if (jp instanceof Call) {
            str += this.buildLabel("fun", jp.name);
        }

        if (jp instanceof FunctionJp) {
            str += this.buildLabel("sig", jp.signature);
        }
        this.addLevelToResult(str, indent);

        if (jp.children.length > 4) {
            var allLits = true;
            for (const child of jp.children) {
                if (!(child instanceof IntLiteral)) {
                    allLits = false;
                }
            }
            if (allLits) {
                this.addLevelToResult(jp.joinPointType + " (" + jp.children.length + "x)", indent + 2);
                return;
            }
        }
        for (const child of jp.children) {
            this.dumpJoinPoint(child, indent + 1);
        }
    }

    private addLevelToResult(str: string, indent: number): void {
        this.currentRes += `${'-'.repeat(indent)}>${str}\n`;
    }
}