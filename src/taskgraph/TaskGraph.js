"use strict";

laraImport("taskgraph/Task");
laraImport("util/ClavaUtils");
class TaskGraph {
    #tasks = [];
    #source = null;
    #sink = null;
    #topFunction = null;

    constructor(topFunction) {
        this.#source = new Task(null, "START");
        this.#sink = new Task(null, "END");
        this.#topFunction = topFunction;
        this.build(topFunction);
    }

    //---------------------
    // Getters/setters
    //---------------------

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

    //---------------------
    // Builder methods
    //---------------------

    build(topFunction) {
        const allFunctions = ClavaUtils.getAllUniqueFunctions(topFunction, true);
        const filteredFuns = [];

        for (const fun of allFunctions) {
            if (!ExternalFunctionsMatcher.isValidExternal(fun)) {
                filteredFuns.push(fun);
            }
        }

        const tasks = [];
        for (const fun of filteredFuns) {
            const type = fun.isInSystemHeader ? "EXTERNAL" : "REGULAR";
            const task = new Task(fun, type);
            tasks.push(task);
        }
        this.addTasks(tasks);
    }
}