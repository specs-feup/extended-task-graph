"use strict";

class Data {
    #decl = null;
    #isInit = false;
    #isWritten = false;
    #isRead = false;

    #isScalar = false;
    #dims = [];
    #sizeInBytes = -1;
    #datatype = null;
    #datatypeSize = 4;

    #origin = "UNKNOWN"
    #alternateName = "<none>";

    constructor(decl, origin) {
        this.#decl = decl;
        this.#origin = origin;
        this.#demangleDatatype(decl);
    }

    getName() {
        return this.#decl.name;
    }

    getDecl() {
        return this.#decl;
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

    getOriginType() {
        return this.#origin;
    }

    getDatatypeSize() {
        return this.#datatypeSize;
    }

    isNewlyCreated() {
        return this.#origin === "NEW";
    }

    isFromParam() {
        return this.#origin === "PARAM";
    }

    isFromGlobal() {
        return this.#origin === "GLOBAL";
    }

    isScalar() {
        return this.#isScalar;
    }

    toString() {
        const status = !this.#isInit ? "U" : (this.#isRead ? "R" : "") + (this.#isWritten ? "W" : "");
        return `${this.#decl.name} {${this.#sizeInBytes}} ${status}`;
    }

    #demangleDatatype(decl) {
        const type = decl.type;
        const typeCode = type.code;

        if (type.isArray) {
            this.#demangleArray(typeCode);
        }
        else if (type.isPointer) {
            println("Pointer: " + typeCode);
        }
        else {
            this.#demangleScalar(typeCode);
        }
    }

    #demangleScalar(typeCode) {
        this.#datatype = typeCode;
        this.#datatypeSize = ClavaUtils.getDatatypeSize(typeCode);
        this.#sizeInBytes = this.#datatypeSize;
        this.#isScalar = true;
    }

    #demangleArray(typeCode) {
        const datatype = typeCode.substring(0, typeCode.indexOf("["));
        const dimsStr = typeCode.substring(typeCode.indexOf("[") + 1);
        const dims = dimsStr.match(/\d+/g).map(Number);
        const datatypeSize = ClavaUtils.getDatatypeSize(datatype);

        let size = 0;
        for (const dim of dims) {
            size += dim * datatypeSize;
        }

        this.#datatype = datatype;
        this.#datatypeSize = datatypeSize;
        this.#sizeInBytes = size;
        this.#isScalar = false;
        this.#dims = dims;
    }
}