"use strict";

class TaskPropertiesFinder {
    #taskGraph;

    constructor(taskGraph) {
        this.#taskGraph = taskGraph;
    }

    calculateUniqueTasks() {
        const uniqueTasks = {};
        const tasks = this.#taskGraph.getTasks();

        for (const task of tasks) {
            const taskName = task.getName();
            const taskReps = task.getRepetitions();

            if (taskName in uniqueTasks) {

                uniqueTasks[taskName]["instances"].push(taskReps);
            }
            else {
                const uniqueTaskProps = {
                    "instances": [taskReps],
                    "#statements": this.#countStatements(task),
                }
                uniqueTasks[taskName] = uniqueTaskProps;
            }
        }
        return uniqueTasks;
    }

    #countStatements(task) {
        const func = task.getFunction();
        if (func == null) {
            return -1;
        }
        const cnt = Query.searchFrom(func, "statement").chain();
        return cnt.length;
    }
}