"use strict";

class Data {
    #decl = null;
    #isInit = false;
    #isWritten = false;
    #isRead = false;
    #isScalar = false;
    #dims = [];
    #sizeInBytes = 0;
    #type = null;
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

    getType() {
        return this.#type;
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
        //println(type.code + ", " + type.kind);

        if (type.isArray) {
            println("Array: " + typeCode);
        }
        else if (type.isPointer) {
            println("Pointer: " + typeCode);
        }
        else {
            println("Scalar: " + typeCode);
            this.#isScalar = true;
            this.#type = typeCode;
            this.#sizeInBytes = 0;
        }
    }
}