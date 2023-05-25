"use strict";

class UPTConfig {
    static #config = {};
    static #isInit = false;

    static init(config) {
        if (this.#isInit) {
            return;
        }
        this.#config = config;
        this.#isInit = true;
    }

    static get(key) {
        return this.#config[key];
    }

    static set(key, value) {
        this.#config[key] = value;
    }

    static has(key) {
        return this.#config.hasOwnProperty(key);
    }
}