"use strict";

laraImport("taskgraph/Task");
class TaskGraph {
    #tasks = [];

    constructor() { }

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

    toDot() {
        let dot = "digraph G {\n";
        for (const task of this.#tasks) {
            dot += `    ${task.getId()} [label="${task.getFunction().name}"];\n`;
        }
        dot += "}\n";

        return dot;
    }
}