import { Call, FloatLiteral, FunctionJp, FunctionType, IntLiteral, Literal, Param, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { ConcreteTask } from "./ConcreteTask.js";
import { TaskType } from "./TaskType.js";
import { DataItemOrigin } from "../DataItemOrigin.js";
import { ConstantDataItem } from "../dataitems/ConstantDataItem.js";
import { VariableDataItem } from "../dataitems/VariableDataItem.js";
import { VarrefWriteChecker } from "../../util/VarrefWriteChecker.js";

export class RegularTask extends ConcreteTask {
    private function: FunctionJp;

    constructor(call: Call | null, fun: FunctionJp, hierParent: ConcreteTask | null, delimiter = ".") {
        super(TaskType.REGULAR, call, hierParent, fun.name, delimiter, "T");

        this.function = fun;

        this.populateData();
        this.updateDataReadWrites();

        if (call != null) {
            this.updateWithAlternateNames();
        }
    }

    public getFunction(): FunctionJp {
        return this.function;
    }


    public updateDataItemInterfaces(): void {
        if (this.getCall() == null) {
            return;
        }
        const callArgs = this.getCall()!.args;
        const argNames = callArgs.map(arg => {
            for (const varref of Query.searchFromInclusive(arg, Varref)) {
                return varref.name;
            }
            if (arg instanceof Literal) {
                return `imm(${arg.code})`;
            }
            return arg.code;
        });

        for (const dataItem of this.getData()) {
            if (dataItem.getItemOriginType() == DataItemOrigin.PARAM) {

                if (dataItem instanceof VariableDataItem) {
                    const params = this.getFunction().params;

                    for (let i = 0; i < params.length; i++) {
                        if (params[i].name == dataItem.getNameInTask()) {
                            dataItem.setNameInInterface(argNames[i]!);
                        }
                    }
                }
            }
        }
    }

    private populateData(): void {
        // handle data comm'd through function params
        this.findDataFromParams();

        // handle data comm'd through global variables
        this.findDataFromGlobals();

        // handle data created in this function, and comm'd to others
        this.findDataFromNewDecls();

        // handle immediate constants in function calls
        this.findDataFromConstants();
    }

    private findDataFromParams(): void {
        const paramVars: Set<Param> = new Set();
        for (const param of Query.searchFrom(this.function, Param)) {
            paramVars.add(param);
        }
        this.createDataObjects([...paramVars], DataItemOrigin.PARAM);
    }

    private findDataFromGlobals(): void {
        const globalVars = new Map();
        for (const varref of Query.searchFrom(this.function.body, Varref)) {
            try {
                if (!(varref.type instanceof FunctionType)) {
                    const decl = varref.vardecl;

                    if (decl != null && decl.isGlobal) {
                        globalVars.set(decl.name, decl);
                    }
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            catch (e) {
                // As far as I understand, this error can be ignored. These varrefs are from function names
            }
        }
        const declList = globalVars.values();
        this.createDataObjects([...declList], DataItemOrigin.GLOBAL_REF);
    }

    private findDataFromNewDecls(): void {
        const newVars: Set<Vardecl> = new Set();
        for (const vardecl of Query.searchFrom(this.function.body, Vardecl)) {
            newVars.add(vardecl);
        }
        this.createDataObjects([...newVars], DataItemOrigin.NEW);
    }

    private findDataFromConstants(): void {
        for (const funCall of Query.searchFrom(this.function.body, Call)) {
            for (const intConst of Query.searchFrom(funCall, IntLiteral)) {
                this.createConstantObject(intConst, funCall);
            }
            for (const floatConst of Query.searchFrom(funCall, FloatLiteral)) {
                this.createConstantObject(floatConst, funCall);
            }
        }
    }

    private updateDataReadWrites(): void {
        for (const dataItem of this.getData()) {
            if (dataItem instanceof ConstantDataItem) {
                continue;
            }
            const vardecl = (dataItem as VariableDataItem).getDecl();

            for (const ref of Query.searchFrom(this.function.body, Varref, { name: vardecl?.name })) {
                const checker = new VarrefWriteChecker();

                if ((checker.isWrittenTo(ref))) {
                    dataItem.setWritten();
                }
                else {
                    dataItem.setRead();
                }
            }
        }
    }

    private updateWithAlternateNames(): void {
        const call = this.getCall();
        if (call == null) {
            console.log(`[RegularTask] Call is null in task ${this.getUniqueName()}, cannot update with alternate names`);
            return;
        }
        const args = [];
        for (let i = 1; i < call.children.length; i++) {
            const child = call.children[i];

            // Two types of parameter: varrefs and literals (int/float)
            // we use .get()[0] because .first() emits an annoying warning when it doesn't find anything
            const varref = Query.searchFromInclusive(child, Varref).get()[0];
            if (varref != null) {
                args.push(varref.name);
            }
            else {
                const intLit = Query.searchFromInclusive(child, IntLiteral).get()[0];
                if (intLit != null) {
                    args.push(`imm(${intLit.value})`);
                }
                else {
                    const floatLit = Query.searchFromInclusive(child, FloatLiteral).get()[0];
                    if (floatLit != null) {
                        args.push(`imm(${floatLit.value})`);
                    }
                }
            }
        }

        const dataParams = this.getParamData();
        if (dataParams.length != args.length) {
            throw new Error(`Mismatch between number of arguments and parameters when setting alternate names for Task data`);
        }
        for (let i = 0; i < dataParams.length; i++) {
            dataParams[i].setNameInPreviousTask(args[i]);
        }
    }
}