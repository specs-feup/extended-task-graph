"use strict";

laraImport("lara.util.IdGenerator");
laraImport("weaver.Query");
laraImport("taskgraph/Data");
laraImport("taskgraph/DataOrigins");

class Task {
    // Constants
    #DEFAULT_DELIMITER = ".";
    // Basic task details
    #id = "TNull";
    #function = null;
    #call = null;
    #name = "<anonymous>"
    #type = null;
    // Repetition properties
    #repetitions = 1;
    #loopRef = null;
    // Hierarchical properties
    #hierParent = null;
    #hierChildren = new Set();
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
    // Task annotations (e.g., performance properties)
    #annotations = {};

    constructor(fun, hierParent, type = "REGULAR") {
        this.#type = type;
        this.#hierParent = hierParent;

        switch (type) {
            case "REGULAR":
            case "EXTERNAL": {
                const idPrefix = (hierParent != null && hierParent.getType() == "REGULAR") ?
                    `${hierParent.getId()}${this.#DEFAULT_DELIMITER}`
                    : (type == "REGULAR" ? "T" : "TEx");

                this.#id = IdGenerator.next(idPrefix);
                this.#function = fun;
                if (fun != null) {
                    this.#name = fun.name;
                }
                break;
            }
            case "START": {
                this.#id = "TStart";
                this.#name = "main_begin";
                break;
            }
            case "END": {
                this.#id = "TEnd";
                this.#name = "main_end";
                break;
            }
            case "GLOBAL": {
                this.#id = "TGlob";
                this.#name = "Global variables";
                break;
            }
            default: {
                throw new Error(`Unknown task type '${type}'`);
            }
        }

        if (type != "START" && type != "END" && type != "GLOBAL" && fun != null) {
            this.#populateData();
        }
        if (type == "GLOBAL") {
            this.#populateGlobalData();
        }
    }

    getType() {
        return this.#type;
    }

    getId() {
        return this.#id;
    }

    getName() {
        return this.#name;
    }

    getUniqueName() {
        return `${this.#id}-${this.#name}`;
    }

    getFunction() {
        return this.#function;
    }

    getCall() {
        return this.#call;
    }

    setCall(call) {
        this.#call = call;
    }

    setRepetitions(reps, loopRef) {
        this.#repetitions = reps;
        this.#loopRef = loopRef;
    }

    getRepetitions() {
        return this.#repetitions;
    }

    getLoopReference() {
        return this.#loopRef;
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

    #getDataByAccessType(accessType, origin = DataOrigins.ANY) {
        let data = [];
        if (origin == DataOrigins.ANY) {
            data = [
                ...this.#dataParams,
                ...this.#dataGlobals,
                ...this.#dataNew,
                ...this.#dataConstants];
        }
        if (origin == DataOrigins.PARAM) {
            data = this.#dataParams;
        }
        if (origin == DataOrigins.GLOBAL) {
            data = this.#dataGlobals;
        }
        if (origin == DataOrigins.NEW) {
            data = this.#dataNew;
        }
        if (origin == DataOrigins.CONSTANT) {
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

    getDataRead(type = DataOrigins.ANY) {
        return this.#getDataByAccessType("READ", type);
    }

    getDataWritten(type = DataOrigins.ANY) {
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

    getGlobalData() {
        return this.#dataGlobals;
    }

    getNewData() {
        return this.#dataNew;
    }

    getConstantData() {
        return this.#dataConstants;
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

    // Misc methods
    updateWithAlternateNames(call) {
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

        const dataParams = this.#dataParams;
        if (dataParams.length != args.length) {
            throw new Error(`Mismatch between number of arguments and parameters when setting alternate names for Task data`);
        }
        for (let i = 0; i < dataParams.length; i++) {
            dataParams[i].setAlternateName(args[i]);
        }
    }

    // Performance properties
    getAnnotation(key) {
        if (key in this.#annotations) {
            return this.#annotations[key];
        }
        return null;
    }

    setAnnotation(key, value) {
        this.#annotations[key] = value;
    }

    // ---------------------------------------------------------------------
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
        this.#createDataObjects([...paramVars], DataOrigins.PARAM);
    }

    #findDataFromGlobals() {
        const globalVars = new Set();
        for (const varref of Query.searchFrom(this.#function.body, "varref")) {
            try {
                const decl = varref.vardecl;
                if (decl != null && decl.isGlobal) {
                    globalVars.add(decl);
                }
            }
            catch (e) {
                println(`Could not find vardecl for varref: ${varref.name}`);
            }
        }
        this.#createDataObjects([...globalVars], DataOrigins.GLOBAL);
    }

    #findDataFromNewDecls() {
        const newVars = new Set();
        for (const vardecl of Query.searchFrom(this.#function.body, "vardecl")) {
            newVars.add(vardecl);
        }
        this.#createDataObjects([...newVars], DataOrigins.NEW);
    }

    #createDataObjects(vars, originType) {
        for (const vardecl of vars) {
            const data = new Data(vardecl, originType);

            this.#setReadWritesFunction(data);

            switch (originType) {
                case DataOrigins.PARAM:
                    this.#dataParams.push(data);
                    break;
                case DataOrigins.GLOBAL:
                    this.#dataGlobals.push(data);
                    break;
                case DataOrigins.NEW:
                    this.#dataNew.push(data);
                    break;
                default:
                    break;
            }
        }
    }

    #findDataFromConstants() {
        for (const funCall of Query.searchFrom(this.#function.body, "call")) {
            for (const immConst of Query.searchFrom(funCall, "literal")) {
                this.#createConstantObject(immConst, funCall);
            }
        }
    }

    #createConstantObject(immConst, funCall) {
        const datum = new Data(immConst, DataOrigins.CONSTANT);
        datum.setImmediateFunctionCall(funCall);
        this.#dataConstants.push(datum);
    }

    #setReadWritesFunction(data) {
        const body = this.#function.body;
        if (body == null) {
            return;
        }

        if (body.children.length == 0) {
            data.setRead();
            return;
        }

        for (const varref of Query.searchFrom(body, "varref", { name: data.getDecl().name })) {
            this.#setReadWritesVar(varref, data);
        }
    }

    #setReadWritesVar(varref, data) {
        if (ClavaUtils.isDef(varref)) {
            data.setWritten();
        }
        else {
            data.setRead();
        }
    }

    #populateGlobalData() {
        for (const global of Query.search("vardecl", { isGlobal: true })) {
            const data = new Data(global, DataOrigins.GLOBAL);
            this.#dataGlobals.push(data);
            this.#setReadWritesVar(global, data);
        }
    }
}