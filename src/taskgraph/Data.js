"use strict";

class Data {
    #decl = null;
    #isWritten = false;
    #isRead = false;
    #isScalar = false;
    #sizeInBytes = 0;
    #origin = "UNKNOWN"
    #alternateName = "none";

    constructor(decl, origin) {
        this.#decl = decl;
        this.#origin = origin;
    }

    getName() {
        return this.#decl.name;
    }

    getDecl() {
        return this.#decl;
    }

    getAlternateName() {
        return this.#alternateName;
    }

    setAlternateName(name) {
        this.#alternateName = name;
    }

    setWritten() {
        this.#isWritten = true;
    }

    setRead() {
        this.#isRead = true;
    }

    isWritten() {
        return this.#isWritten;
    }

    isRead() {
        return this.#isRead;
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
        const readWrite = (this.#isRead ? "R" : "") + (this.#isWritten ? "W" : "");
        return `${this.#decl.name} {${this.#sizeInBytes}} ${readWrite}`;
    }
}