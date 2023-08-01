"use strict";

laraImport("taskgraph/Task");
laraImport("util/ClavaUtils");
class TaskGraph {
    #tasks = [];
    #comms = [];
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

    getSource() {
        return this.#source;
    }

    getSink() {
        return this.#sink;
    }

    getGlobals() {
        return this.#globals;
    }

    getCommunications() {
        return this.#comms;
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

    addCommunication(source, target, data, rank) {
        const comm = new Communication(source, target, data, rank);
        this.#comms.push(comm);
        source.addOutgoingComm(comm);
        target.addIncomingComm(comm);
    }
}