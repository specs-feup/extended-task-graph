"use strict";

laraImport("lara.util.IdGenerator");

class Task {
    #id = "TNull";
    #function = null;

    constructor(fun) {
        this.#id = IdGenerator.next("T");
        this.#function = fun;
    }

    getId() {
        return this.#id;
    }

    getFunction() {
        return this.#function;
    }
}