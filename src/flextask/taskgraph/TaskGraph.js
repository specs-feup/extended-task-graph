"use strict";

laraImport("flextask/taskgraph/Task");
laraImport("flextask/taskgraph/Communication");
laraImport("flextask/taskgraph/ControlEdge");
laraImport("flextask/util/ClavaUtils");

class TaskGraph {
    #tasks = [];
    #comms = [];
    #control = [];
    #source = null;
    #sink = null;
    #globals = null;
    #inlinables = [];

    constructor() {
        this.#source = new Task(null, null, "START");
        this.#sink = new Task(null, null, "END");
        this.#globals = new Task(null, null, "GLOBAL");
    }

    addTasks(tasks) {
        this.#tasks.push(...tasks);
    }

    addTask(task) {
        this.#tasks.push(task);
    }

    addInlinable(call) {
        this.#inlinables.push(call);
    }

    getTasks() {
        return this.#tasks;
    }

    getTaskById(id) {
        for (const task of this.#tasks) {
            if (task.getId() === id) {
                return task;
            }
        }
        return null;
    }

    getTasksByType(type) {
        const tasks = [];
        for (const task of this.#tasks) {
            if (task.getType() === type) {
                tasks.push(task);
            }
        }
        return tasks;
    }

    getSourceTask() {
        return this.#source;
    }

    getSinkTask() {
        return this.#sink;
    }

    getGlobalTask() {
        return this.#globals;
    }

    getCommunications() {
        return this.#comms;
    }

    getControlEdges() {
        return this.#control;
    }

    getInlinables() {
        return this.#inlinables;
    }

    getTopHierarchicalTask() {
        for (const task of this.#tasks) {
            if (task.getHierarchicalParent() == null) {
                return task;
            }
        }
        return null;
    }

    addCommunication(source, target, sourceData, targetData, rank) {
        const comm = new Communication(source, target, sourceData, targetData, rank);
        this.#comms.push(comm);
        source.addOutgoingComm(comm);
        target.addIncomingComm(comm);
    }

    addControlEdge(source, target, controlVar, controlValue) {
        const control = new ControlEdge(source, target, controlVar, controlValue);
        this.#control.push(control);
        source.addOutgoingControl(control);
        target.addIncomingControl(control);
    }
}