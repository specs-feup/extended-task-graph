"use strict";

laraImport("taskgraph/Task");
laraImport("util/ClavaUtils");
class TaskGraph {
    #tasks = [];
    #comms = [];
    #source = null;
    #sink = null;
    #inlinables = [];

    constructor() {
        this.#source = new Task(null, "START");
        this.#sink = new Task(null, "END");
    }

    addTasks(tasks) {
        this.#tasks.push(...tasks);
    }

    addTask(task) {
        this.#tasks.push(task);
    }

    addCommunication(source, target, data) {
        for (const comm of this.#comms) {
            if (comm.getSource().getId() === source.getId() && comm.getTarget().getId() === target.getId()) {
                comm.addData(data);
                return;
            }
        }
        const communication = new Communication(source, target, data);
        source.addOutgoingComm(communication);
        target.addIncomingComm(communication);
        this.#comms.push(communication);
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