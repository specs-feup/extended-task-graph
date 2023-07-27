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
    #data = [];

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

    getData() {
        return this.#data;
    }

    getDataRead() {
        const dataRead = [];
        for (const data of this.#data) {
            if (data.isRead()) {
                dataRead.push(data);
            }
        }
        return dataRead;
    }

    getDataWritten() {
        const dataWritten = [];
        for (const data of this.#data) {
            if (data.isWritten()) {
                dataWritten.push(data);
            }
        }
        return dataWritten;
    }

    getDataCreatedHere() {
        const dataCreated = [];
        for (const data of this.#data) {
            if (data.isNewlyCreated()) {
                dataCreated.push(data);
            }
        }
        return dataCreated;
    }

    getReferencedData() {
        const dataReferenced = [];
        for (const data of this.#data) {
            if (!data.isNewlyCreated()) {
                dataReferenced.push(data);
            }
        }
        return dataReferenced;
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

            this.#data.push(data);
        }
    }

    #setReadWrites(data) {
        const body = this.#function.body;

        if (body.children.length == 0) {
            data.setRead();
            return;
        }

        let foundRead = false;
        let foundWrite = false;
        for (const varref of Query.searchFrom(body, "varref", { name: data.getDecl().name })) {
            println("Found varref: " + varref.name);

        }
    }
}