"use strict";

laraImport("flextask/taskgraph/DataItemOrigins");

class DataItem {
    #ref = null;
    #name = "<noname>";
    #isInit = false;
    #isWritten = false;
    #isRead = false;

    #isScalar = false;
    #dims = [];
    #sizeInBytes = -1;
    #datatype = null;
    #datatypeSize = 4;

    #itemOrigin = DataItemOrigins.NEW;
    #alternateName = "<no_alt_name>";
    #immediateFunctionCall = null;

    constructor(ref, origin) {
        this.#ref = ref;
        this.#itemOrigin = origin;
        this.#name = this.#getNameFromRef(ref);
        this.#alternateName = this.#name;
        this.#demangleDatatype(ref);
    }

    getName() {
        return this.#name;
    }

    getItemOriginType() {
        return this.#itemOrigin;
    }

    getDecl() {
        return this.#ref;
    }

    getDatatype() {
        return this.#datatype;
    }

    getDimensions() {
        return this.#dims;
    }

    getAlternateName() {
        return this.#alternateName;
    }

    getSizeInBytes() {
        return this.#sizeInBytes;
    }

    setAlternateName(name) {
        this.#alternateName = name;
    }

    setWritten() {
        this.#isInit = true;
        this.#isWritten = true;
    }

    setRead() {
        this.#isInit = true;
        this.#isRead = true;
    }

    setInitialized() {
        this.#isInit = true;
    }

    isWritten() {
        return this.#isWritten;
    }

    isRead() {
        return this.#isRead;
    }

    isInitialized() {
        return this.#isInit;
    }

    isOnlyRead() {
        return this.#isRead && !this.#isWritten;
    }

    isOnlyWritten() {
        return !this.#isRead && this.#isWritten;
    }

    getDatatypeSize() {
        return this.#datatypeSize;
    }

    getImmediateFunctionCall() {
        return this.#immediateFunctionCall;
    }

    setImmediateFunctionCall(call) {
        if (this.#itemOrigin !== DataItemOrigins.CONSTANT) {
            throw new Error("You can only specify an immediate function call for immediate constants!");
        }
        this.#immediateFunctionCall = call;
    }

    isNewlyCreated() {
        return this.#itemOrigin === DataItemOrigins.NEW;
    }

    isFromParam() {
        return this.#itemOrigin === DataItemOrigins.PARAM;
    }

    isFromGlobal() {
        return this.#itemOrigin === DataItemOrigins.GLOBAL;
    }

    isConstant() {
        return this.#itemOrigin === DataItemOrigins.CONSTANT;
    }

    isScalar() {
        return this.#isScalar;
    }

    toString() {
        const status = !this.#isInit ? "U" : (this.#isRead ? "R" : "") + (this.#isWritten ? "W" : "");
        return `${this.#ref.name} {${this.#sizeInBytes}} ${status}`;
    }

    #demangleDatatype(decl) {
        const type = decl.type;
        const typeCode = type.code;

        if (type.isArray) {
            this.#demangleArray(typeCode);
        }
        else if (type.isPointer) {
            this.#demanglePointer(typeCode);
        }
        else {
            this.#demangleScalar(typeCode);
        }
    }

    #getNameFromRef(ref) {
        if (ref.instanceOf(["intLiteral", "floatLiteral"])) {
            return "imm(" + ref.value + ")";
        }
        else {
            return ref.name;
        }
    }

    #demangleScalar(typeCode) {
        this.#datatype = typeCode;
        this.#datatypeSize = ClavaUtils.getDatatypeSize(typeCode);
        this.#sizeInBytes = this.#datatypeSize;
        this.#isScalar = true;
    }

    #demanglePointer(typeCode) {
        const datatype = typeCode.substring(0, typeCode.indexOf("*"));
        const datatypeSize = ClavaUtils.getDatatypeSize(datatype);

        const refCount = typeCode.match(/\*/g).length;
        const dims = Array.from({ length: refCount }, () => -1);

        this.#dims = dims;
        this.#datatype = datatype;
        this.#datatypeSize = datatypeSize;
        this.#isScalar = false;
    }

    #demangleArray(typeCode) {
        const datatype = typeCode.substring(0, typeCode.indexOf("["));
        const datatypeSize = ClavaUtils.getDatatypeSize(datatype);

        const dimsStr = typeCode.substring(typeCode.indexOf("[") + 1);
        if (!dimsStr.startsWith("]")) {
            const dims = dimsStr.match(/\d+/g).map(Number);
            let size = 0;
            for (const dim of dims) {
                size += dim * datatypeSize;
            }
            this.#dims = dims;
            this.#sizeInBytes = size;
        }

        this.#datatype = datatype;
        this.#datatypeSize = datatypeSize;
        this.#isScalar = false;
    }
}