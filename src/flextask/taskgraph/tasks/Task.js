"use strict";

laraImport("lara.util.IdGenerator");
laraImport("weaver.Query");
laraImport("flextask/taskgraph/DataItem");
laraImport("flextask/taskgraph/DataItemOrigins");

class Task {
    // Basic task details
    #id = "TNull";
    #function = null;
    #name = "<anonymous>"
    #type = null;

    // Data properties
    #dataParams = [];
    #dataGlobals = [];
    #dataNew = [];
    #dataConstants = [];

    // Data communication properties
    #incomingComm = [];
    #outgoingComm = [];

    // Control properties
    #incomingControl = [];
    #outgoingControl = [];

    constructor(type) {
        this.#type = type;
    }

    getType() {
        return this.#type;
    }

    getId() {
        return this.#id;
    }

    setId(id) {
        this.#id = id;
    }

    getName() {
        return this.#name;
    }

    setName(name) {
        this.#name = name;
    }

    getUniqueName() {
        return `${this.#id}-${this.#name}`;
    }

    // Data methods
    getDataRead(type = DataItemOrigins.ANY) {
        return this.#getDataByAccessType("READ", type);
    }

    getDataWritten(type = DataItemOrigins.ANY) {
        return this.#getDataByAccessType("WRITE", type);
    }

    getData() {
        return [...this.#dataParams, ...this.#dataGlobals, ...this.#dataNew, ...this.#dataConstants];
    }

    getDataAsMap() {
        const data = new Map();
        for (const datum of this.getData()) {
            data.set(datum.getName(), datum);
        }
        return data;
    }

    getParamData() {
        return this.#dataParams;
    }

    addParamData(dataItem) {
        this.#dataParams.push(dataItem);
    }

    getGlobalData() {
        return this.#dataGlobals;
    }

    addGlobalData(dataItem) {
        this.#dataGlobals.push(dataItem);
    }

    getNewData() {
        return this.#dataNew;
    }

    addNewData(dataItem) {
        this.#dataNew.push(dataItem);
    }

    getConstantData() {
        return this.#dataConstants;
    }

    addConstantData(dataItem) {
        this.#dataConstants.push(dataItem);
    }

    getReferencedData() {
        return [...this.#dataParams, ...this.#dataGlobals];
    }

    // Communication methods
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

    getOutgoingOfData(datum) {
        const comm = [];
        for (const communication of this.#outgoingComm) {
            if (communication.getSourceData().getName() == datum.getName() ||
                communication.getSourceData().getAlternateName() == datum.getName()) {
                comm.push(communication);
            }
        }
        return comm;
    }

    getIncomingOfData(datum) {
        for (const communication of this.#incomingComm) {
            if (communication.getTargetData().getName() == datum.getName() ||
                communication.getTargetData().getAlternateName() == datum.getName()) {
                return communication;
            }
        }
        return null;
    }

    // Control methods
    getOutgoingControl() {
        return this.#outgoingControl;
    }

    getIncomingControl() {
        return this.#incomingControl;
    }

    addOutgoingControl(control) {
        this.#outgoingControl.push(control);
    }

    addIncomingControl(control) {
        this.#incomingControl.push(control);
    }

    // ---------------------------------------------------------------------
    #getDataByAccessType(accessType, origin = DataItemOrigins.ANY) {
        let data = [];
        if (origin == DataItemOrigins.ANY) {
            data = [
                ...this.#dataParams,
                ...this.#dataGlobals,
                ...this.#dataNew,
                ...this.#dataConstants];
        }
        if (origin == DataItemOrigins.PARAM) {
            data = this.#dataParams;
        }
        if (origin == DataItemOrigins.GLOBAL) {
            data = this.#dataGlobals;
        }
        if (origin == DataItemOrigins.NEW) {
            data = this.#dataNew;
        }
        if (origin == DataItemOrigins.CONSTANT) {
            data = this.#dataConstants;
        }

        const dataAccessed = [];
        for (const datum of data) {
            if (accessType === "READ") {
                if (datum.isWritten()) {
                    dataAccessed.push(datum);
                }
            }
            else if (accessType === "WRITE") {
                if (datum.isWritten()) {
                    dataAccessed.push(datum);
                }
            }
        }
        return dataAccessed;
    }

    createDataObjects(vars, originType) {
        for (const vardecl of vars) {
            const data = new DataItem(vardecl, originType);

            this.setReadWritesFunction(data);

            switch (originType) {
                case DataItemOrigins.PARAM:
                    this.#dataParams.push(data);
                    break;
                case DataItemOrigins.GLOBAL:
                    this.#dataGlobals.push(data);
                    break;
                case DataItemOrigins.NEW:
                    this.#dataNew.push(data);
                    break;
                default:
                    break;
            }
        }
    }

    createConstantObject(immConst, funCall) {
        const datum = new DataItem(immConst, DataItemOrigins.CONSTANT);
        datum.setImmediateFunctionCall(funCall);
        this.#dataConstants.push(datum);
    }

    setReadWritesFunction(data) {
        if (this.#function == null) {
            return;
        }

        const body = this.#function.body;
        if (body == null) {
            return;
        }

        if (body.children.length == 0) {
            data.setRead();
            return;
        }

        for (const varref of Query.searchFrom(body, "varref", { name: data.getDecl().name })) {
            this.setReadWritesVar(varref, data);
        }
    }

    setReadWritesVar(varref, data) {
        if (ClavaUtils.isDef(varref)) {
            data.setWritten();
        }
        else {
            data.setRead();
        }
    }
}