"use strict";

laraImport("lara.util.IdGenerator");

class Task {
    #id = "TNull";
    #function = null;
    #type = null;

    constructor(fun, type) {
        this.#type = type;

        if (type == "REGULAR") {
            this.#id = IdGenerator.next("T");
            this.#function = fun;
        }
        if (type == "START") {
            this.#id = "TStart";
        }
        if (type == "END") {
            this.#id = "TEnd";
        }
        if (type == "EXTERNAL") {
            this.#id = IdGenerator.next("TEx");
            this.#function = fun;
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
}