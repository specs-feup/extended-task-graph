"use strict";

class ControlEdge {
    source = null;
    target = null;
    controlVar = null;
    controlValue = true;

    constructor(source, target, controlVar, controlValue) {
        this.source = source;
        this.target = target;
        this.controlVar = controlVar;
        this.controlValue = controlValue;
    }

    getSource() {
        return this.source;
    }

    getTarget() {
        return this.target;
    }

    getControlVariable() {
        return this.controlVar;
    }

    getControlValue() {
        return this.controlValue;
    }

    setControlValue(value) {
        this.controlValue = value;
    }

    toString() {
        const str = `${this.controlVar.name}\n${this.controlValue ? "TRUE" : "FALSE"}`;
        return str;
    }
}