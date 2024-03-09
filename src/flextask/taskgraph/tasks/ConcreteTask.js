"use strict";

laraImport("lara.util.IdGenerator");
laraImport("flextask/taskgraph/tasks/Task");
laraImport("flextask/taskgraph/tasks/TaskTypes");


class ConcreteTask extends Task {
    #call;
    #hierParent;
    #hierChildren = new Set();
    #repetitions = 1;
    #loopRef;

    constructor(type, call, hierParent, name, delimiter = ".", prefix = "T") {
        super(type);

        const idPrefix = (hierParent != null && hierParent.getType() == TaskTypes.REGULAR) ?
            `${hierParent.getId()}${delimiter}` : prefix;
        const id = IdGenerator.next(idPrefix);

        this.setId(id);
        this.setName(name);
        this.#call = call;
        if (hierParent != null) {
            this.#hierParent = hierParent;
        }
    }

    getCall() {
        return this.#call;
    }

    // Repetitions
    setRepetitions(reps, loopRef) {
        this.#repetitions = reps;
        this.#loopRef = loopRef;
    }

    getRepetitions() {
        return this.#repetitions;
    }

    getLoopReference() {
        return this.#loopRef;
    }

    // Hierarchical stuff
    getHierarchicalParent() {
        return this.#hierParent;
    }

    getHierarchicalChildren() {
        return [...this.#hierChildren];
    }

    addHierarchicalChild(child) {
        this.#hierChildren.add(child);
    }

    removeHierarchicalChild(child) {
        this.#hierChildren.delete(child);
    }
}