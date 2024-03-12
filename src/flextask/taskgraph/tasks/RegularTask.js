"use strict";

laraImport("lara.util.IdGenerator");
laraImport("flextask/taskgraph/tasks/ConcreteTask");
laraImport("flextask/taskgraph/tasks/TaskTypes");
laraImport("flextask/util/ClavaUtils");


class RegularTask extends ConcreteTask {
    #function;

    constructor(call, fun, hierParent, delimiter = ".") {
        super(TaskTypes.REGULAR, call, hierParent, fun.name, delimiter, "T");

        this.#function = fun;

        this.#populateData();
        this.#updateDataReadWrites();

        if (call != null) {
            this.#updateWithAlternateNames();
        }
    }

    getFunction() {
        return this.#function;
    }

    #populateData() {
        // handle data comm'd through function params
        this.#findDataFromParams();

        // handle data comm'd through global variables
        this.#findDataFromGlobals();

        // handle data created in this function, and comm'd to others
        this.#findDataFromNewDecls();

        // handle immediate constants in function calls
        this.#findDataFromConstants();
    }

    #findDataFromParams() {
        const paramVars = new Set();
        for (const param of Query.searchFrom(this.#function, "param")) {
            paramVars.add(param);
        }
        this.createDataObjects([...paramVars], DataItemOrigins.PARAM);
    }

    #findDataFromGlobals() {
        const globalVars = new Set();
        for (const varref of Query.searchFrom(this.#function.body, "varref")) {
            try {
                if (varref.type != "functionType") {
                    const decl = varref.vardecl;

                    if (decl != null && decl.isGlobal) {
                        globalVars.add(decl);
                    }
                }
            }
            catch (e) {
                // As far as I understand, this error can be ignored. These varrefs are from function names
                //println(`Could not find vardecl for varref ${varref.name} of type ${varref.type}`);
            }
        }
        this.createDataObjects([...globalVars], DataItemOrigins.GLOBAL);
    }

    #findDataFromNewDecls() {
        const newVars = new Set();
        for (const vardecl of Query.searchFrom(this.#function.body, "vardecl")) {
            newVars.add(vardecl);
        }
        this.createDataObjects([...newVars], DataItemOrigins.NEW);
    }

    #findDataFromConstants() {
        for (const funCall of Query.searchFrom(this.#function.body, "call")) {
            for (const immConst of Query.searchFrom(funCall, "literal")) {
                this.createConstantObject(immConst, funCall);
            }
        }
    }

    #updateDataReadWrites() {
        for (const dataItem of this.getData()) {
            const varref = dataItem.getDecl();

            for (const ref of Query.searchFrom(this.#function.body, "varref", { name: varref.name })) {
                if ((ClavaUtils.isDef(ref))) {
                    dataItem.setWritten();
                }
                else {
                    dataItem.setRead();
                }
            };
        }
    }

    #updateWithAlternateNames() {
        const call = this.getCall();
        const args = [];
        for (let i = 1; i < call.children.length; i++) {
            const child = call.children[i];

            // Two types of parameter: varrefs and literals (int/float)
            // we use .get()[0] because .first() emits an annoying warning when it doesn't find anything
            const varref = Query.searchFromInclusive(child, "varref").get()[0];
            if (varref != null) {
                args.push(varref.name);
            }
            else {
                const intLit = Query.searchFromInclusive(child, "intLiteral").get()[0];
                if (intLit != null) {
                    args.push(`imm(${intLit.value})`);
                }
                else {
                    const floatLit = Query.searchFromInclusive(child, "floatLiteral").get()[0];
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
            dataParams[i].setAlternateName(args[i]);
        }
    }
}