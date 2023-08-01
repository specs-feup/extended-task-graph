"use strict";

laraImport("lara.util.IdGenerator");
laraImport("weaver.Query");
laraImport("taskgraph/Data");

class Task {
    #id = "TNull";
    #function = null;
    #type = null;
    #hierParent = null;
    #hierChildren = new Set();
    #dataParams = [];
    #dataGlobals = [];
    #dataNew = [];
    #incomingComm = [];
    #outgoingComm = [];

    constructor(fun, hierParent, type = "REGULAR") {
        this.#type = type;
        this.#hierParent = hierParent;

        if (type == "REGULAR") {
            this.#id = IdGenerator.next("T");
            this.#function = fun;
        }
        else if (type == "START") {
            this.#id = "TStart";
        }
        else if (type == "END") {
            this.#id = "TEnd";
        }
        else if (type == "EXTERNAL") {
            this.#id = IdGenerator.next("TEx");
            this.#function = fun;
        }
        else {
            throw new Error(`Unknown task type '${type}'`);
        }

        if (type != "START" && type != "END" && fun != null) {
            this.#populateData();
        }
    }

    getType() {
        return this.#type;
    }

    getId() {
        return this.#id;
    }

    getFunction() {
        return this.#function;
    }

    getHierarchicalParent() {
        return this.#hierParent;
    }

    getHierarchicalChildren() {
        return [...this.#hierChildren];
    }

    addHierarchicalChild(child) {
        this.#hierChildren.add(child);
    }

    removeHierarchicalChild(child) {
        this.#hierChildren.delete(child);
    }

    #getDataBasedOnAccess(access, type = "ALL") {
        let data = [];
        if (type == "ALL") {
            data.push(...this.#dataParams, ...this.#dataGlobals, ...this.#dataNew);
        }
        else if (type == "PARAM") {
            data = this.#dataParams;
        }
        else if (type == "GLOBAL") {
            data = this.#dataGlobals;
        }
        else if (type == "NEW") {
            data = this.#dataNew;
        }

        const dataAccessed = [];
        for (const datum of data) {
            if (access === "READ") {
                if (datum.isWritten()) {
                    dataAccessed.push(data);
                }
            }
            else if (access === "WRITE") {
                if (datum.isWritten()) {
                    dataAccessed.push(data);
                }
            }
        }
        return dataAccessed;
    }

    getDataRead(type = "ALL") {
        return this.#getDataBasedOnAccess("READ", type);
    }

    getDataWritten(type = "ALL") {
        return this.#getDataBasedOnAccess("WRITE", type);
    }

    getData() {
        return [...this.#dataParams, ...this.#dataGlobals, ...this.#dataNew];
    }

    getParamData() {
        return this.#dataParams;
    }

    getGlobalData() {
        return this.#dataGlobals;
    }

    getNewData() {
        return this.#dataNew;
    }

    getReferencedData() {
        return [...this.#dataParams, ...this.#dataGlobals];
    }

    addOutgoingComm(communication) {
        this.#outgoingComm.push(communication);
    }

    addIncomingComm(communication) {
        this.#incomingComm.push(communication);
    }

    getOutgoingComm() {
        return this.#outgoingComm;
    }

    getIncomingComm() {
        return this.#incomingComm;
    }

    updateWithAlternateNames(call) {
        const args = [];
        for (let i = 1; i < call.children.length; i++) {
            const child = call.children[i];
            const varref = Query.searchFromInclusive(child, "varref").first();
            args.push(varref.name);
        }

        const dataParams = this.#dataParams;
        if (dataParams.length != args.length) {
            throw new Error(`Mismatch between number of arguments and parameters when setting alternate names for Task data`);
        }
        for (let i = 0; i < dataParams.length; i++) {
            dataParams[i].setAlternateName(args[i]);
        }
    }

    #populateData() {
        // handle data comm'd through function params
        this.#findDataFromParams();

        // handle data comm'd through global variables
        //this.#findDataFromGlobals();

        // handle data created in this function, and comm'd to others
        this.#findDataFromNewDecls();
    }

    #findDataFromParams() {
        const paramVars = new Set();
        for (const param of Query.searchFrom(this.#function, "param")) {
            paramVars.add(param);
        }
        this.#createDataObjects([...paramVars], "PARAM");
    }

    #findDataFromGlobals() {
        const globalVars = new Set();
        for (const varref of Query.searchFrom(this.#function, "varref")) {
            const decl = varref.vardecl;
            if (decl != null && decl.isGlobal()) {
                globalVars.add(decl);
            }
        }
        this.#createDataObjects([...globalVars], "GLOBAL");
    }

    #findDataFromNewDecls() {
        const newVars = new Set();
        for (const vardecl of Query.searchFrom(this.#function, "vardecl")) {
            for (const call of Query.searchFrom(vardecl, "call")) {
                for (const varref of Query.searchFrom(call, "varref")) {
                    const paramDecl = varref.decl;
                    if (paramDecl == vardecl) {
                        newVars.add(vardecl);
                    }
                }
            }
        }
        this.#createDataObjects([...newVars], "NEW");
    }

    #createDataObjects(vars, originType) {
        for (const vardecl of vars) {
            const data = new Data(vardecl, originType);

            this.#setReadWrites(data);

            if (originType == "PARAM") {
                this.#dataParams.push(data);
            }
            else if (originType == "GLOBAL") {
                this.#dataGlobals.push(data);
            }
            else if (originType == "NEW") {
                this.#dataNew.push(data);
            }
        }
    }

    #setReadWrites(data) {
        const body = this.#function.body;

        if (body == null) {
            return;
        }

        if (body.children.length == 0) {
            data.setRead();
            return;
        }

        for (const varref of Query.searchFrom(body, "varref", { name: data.getDecl().name })) {
            if (ClavaUtils.isDef(varref)) {
                data.setWritten();
            }
            else {
                data.setRead();
            }
        }
    }
}