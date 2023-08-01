"use strict";

class Communication {
    #source = null;
    #target = null;
    #data = [];
    #rank = -1;

    constructor(source, target, data, rank) {
        this.#source = source;
        this.#target = target;
        this.#rank = rank;

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
        let str = this.#data.map(d => d.getName()).join(", ");
        str += ` (${this.#rank})`;
        return str;
    }
}