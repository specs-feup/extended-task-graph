import { ArrayAccess, BinaryOp, Call, MemberAccess, ParenExpr, PointerType, UnaryOp, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";

export class VarrefWriteChecker {
    private scenarios: WritingScenario[];

    constructor(scenarios?: WritingScenario[]) {
        if (scenarios) {
            this.scenarios = scenarios;
        }
        else {
            this.scenarios = [
                new SimpleAssignment(),
                new ArrayAssignment(),
                new DereferencingAssignment(),
                new ParenthesisDereferencingAssignment(),
                new StructArrayFieldAssignment(),
                new OverloadedAssignmentOperator()
            ];
        }
    }

    public isWrittenTo(varref: Varref): boolean {
        for (const scenario of this.scenarios) {
            if (scenario.varrefInScenario(varref)) {
                return true;
            }
        }
        return false;
    }
}

export interface WritingScenario {
    varrefInScenario(varref: Varref): boolean;
}

/**
 * Checks if a Varref is being written to in a simple assignment,
 * e.g. `a = 5;`
 */
class SimpleAssignment implements WritingScenario {
    public varrefInScenario(varref: Varref): boolean {
        if (varref.parent instanceof BinaryOp) {
            const binOp = varref.parent;
            return binOp.kind == "assign" && binOp.left.code == varref.code;
        }
        return false;
    }
}

/**
 * Checks if a Varref is being written to in an array assignment,
 * e.g. `a[0] = 5;`
 */
class ArrayAssignment implements WritingScenario {
    public varrefInScenario(varref: Varref): boolean {
        if (varref.parent instanceof ArrayAccess) {
            const arrAccess = varref.parent;

            // if (arrAccess.parent instanceof BinaryOp) {
            //     const binOp = arrAccess.parent;
            //     return binOp.kind == "assign" && binOp.left.code == arrAccess.code;
            // }
            // if (arrAccess.parent instanceof Vardecl) {
            //     return arrAccess.numChildren > 1;
            // }
            const op = arrAccess.getAncestor("binaryOp") as BinaryOp
            if (op == null) {
                return false;
            }

            return op.kind == "assign" && op.left.code.startsWith(varref.name);
        }
        return false;
    }
}

/**
 * Checks if a Varref is being rereferenced and written to in a simple assignment,
 * e.g. `*a = 5;`
 */
class DereferencingAssignment implements WritingScenario {
    public varrefInScenario(varref: Varref): boolean {
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
}

/**
 * Checks if a varref is being dereferenced inside parenthesis and written to in a simple assignment,
 * e.g. `(*a) = 5;`
 */
class ParenthesisDereferencingAssignment implements WritingScenario {
    public varrefInScenario(varref: Varref): boolean {
        if (varref.parent instanceof UnaryOp) {
            const unaryOp = varref.parent;
            if (unaryOp.kind == "deref") {
                if (unaryOp.parent instanceof ParenExpr) {
                    const parenExpr = unaryOp.parent;
                    if (parenExpr.parent instanceof BinaryOp) {
                        const binOp = parenExpr.parent;
                        return binOp.kind == "assign" && binOp.left.code == parenExpr.code;
                    }
                }
            }
        }
        return false;
    }
}

/**
 * Checks if a varref is being written to in a struct field assignment,
 * e.g. `a.b[2] = 5;`
 */
class StructArrayFieldAssignment implements WritingScenario {
    public varrefInScenario(varref: Varref): boolean {
        if (!(varref.parent instanceof MemberAccess)) {
            return false;
        }
        const memberAccess = varref.parent;

        if (!(memberAccess.parent instanceof ArrayAccess)) {
            return false;
        }
        const arrAccess = memberAccess.parent;

        if (!(arrAccess.parent instanceof BinaryOp)) {
            return false;
        }
        const binOp = arrAccess.parent;

        return binOp.kind == "assign" && binOp.left.astId == arrAccess.astId;
    }
}

/**
 * Assignments done with C++ operator= overloads,
 * e.g. `a = b;`, where a and b are objects of a class that has operator= defined
 */
class OverloadedAssignmentOperator implements WritingScenario {
    public varrefInScenario(varref: Varref): boolean {
        const call = varref.getAncestor("call") as Call;
        if (call == undefined) {
            return false;
        }
        if (call.name !== "operator=") {
            return false;
        }
        const lhsCode = call.args[0].code;
        return lhsCode.startsWith(varref.name);
    }
}