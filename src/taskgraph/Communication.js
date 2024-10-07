"use strict";

class Communication {
    #source = null;
    #target = null;
    #sourceData = null;
    #targetData = null;
    #rank = -1;

    constructor(source, target, sourceData, targetData, rank) {
        this.#source = source;
        this.#target = target;
        this.#sourceData = sourceData;
        this.#targetData = targetData;
        this.#rank = rank;
    }

    getSource() {
        return this.#source;
    }

    getTarget() {
        return this.#target;
    }

    getSourceData() {
        return this.#sourceData;
    }

    getTargetData() {
        return this.#targetData;
    }

    getData() {
        return [this.#sourceData, this.#targetData];
    }

    getRank() {
        return this.#rank;
    }

    toString() {
        if (this.#sourceData == null || this.#targetData == null) {
            let str = this.#sourceData != null ? this.#sourceData.getName() : "<undef>";
            str += this.#targetData != null ? "/" + this.#targetData.getName() : "/<undef>";

            println(this.#source.getUniqueName() + " -> " + this.#target.getUniqueName() + " : " + str);

            return str;
        }
        const source = this.#sourceData.getName();
        const target = this.#targetData.getName();
        const limit = 5;

        const nl = (source.length > limit || target.length > limit) ? "\n" : "";
        const str = `${source}/${nl}${target} (${this.#rank})\n{${this.#sourceData.getSizeInBytes()}}`;
        return str;
    }
}