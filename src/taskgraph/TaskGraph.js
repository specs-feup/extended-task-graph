"use strict";

laraImport("taskgraph/Task");
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

    toDot() {
        let dot = "digraph G {\n";
        dot += "    rankdir=TB;\n";
        dot += "    node [shape=box];\n";

        dot += "    TStart [label=\"main_begin\"];\n";
        dot += "    TEnd [label=\"main_begin\"];\n";

        for (const task of this.#tasks) {
            dot += `    ${task.getId()} [label="${task.getFunction().name}"];\n`;
        }
        dot += "}\n";

        return dot;
    }
}