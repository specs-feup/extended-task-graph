"use strict";

class Communication {
    #source = null;
    #target = null;
    #data = [];

    constructor(source, target, data) {
        this.#source = source;
        this.#target = target;
        if (Array.isArray(data)) {
            this.#data.push(...data);
        }
        else {
            this.#data.push(data);
        }
    }

    getData() {
        return this.#data;
    }

    addData(data) {
        this.#data.push(data);
    }

    getSource() {
        return this.#source;
    }

    getTarget() {
        return this.#target;
    }

    toString() {
        const str = this.#data.map(d => d.getName()).join(", ");
        return str;
    }
}