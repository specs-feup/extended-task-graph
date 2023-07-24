"use strict";

laraImport("lara.util.IdGenerator");

class Task {
    #id = "TNull";
    #function = null;
    #type = null;

    constructor(fun, type = "REGULAR") {
        this.#type = type;

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