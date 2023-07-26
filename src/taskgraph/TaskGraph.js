"use strict";

laraImport("taskgraph/Task");
laraImport("util/ClavaUtils");
class TaskGraph {
    #tasks = [];
    #source = null;
    #sink = null;

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

    getSource() {
        return this.#source;
    }

    getSink() {
        return this.#sink;
    }

    getTopHierarchicalTask() {
        for (const task of this.#tasks) {
            if (task.getHierarchicalParent() == null) {
                return task;
            }
        }
        return null;
    }
}