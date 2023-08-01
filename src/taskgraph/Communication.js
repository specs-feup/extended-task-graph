"use strict";

class Communication {
    #source = null;
    #target = null;
    #data = null;
    #rank = -1;

    constructor(source, target, data, rank) {
        this.#source = source;
        this.#target = target;
        this.#data = data;
        this.#rank = rank;
    }

    getData() {
        return this.#data;
    }

    getSource() {
        return this.#source;
    }

    getTarget() {
        return this.#target;
    }

    toString() {
        const str = `${this.#data.getName()} (${this.#rank})\n{${this.#data.getSizeInBytes()}}`;
        return str;
    }
}