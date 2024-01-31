"use strict";

laraImport("clava.code.LoopCharacterizer");

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
                    "#statements": this.#countSyntacticFeature(task, "statement"),
                    "#loops": this.#countSyntacticFeature(task, "loop"),
                    "#whiles": this.#countSyntacticFeature(task, "while"),
                    "#ifs": this.#countSyntacticFeature(task, "if"),
                    "#switches": this.#countSyntacticFeature(task, "switch"),
                    "perLoopsStaticCounts": this.#countStaticLoops(task)
                }
                uniqueTasks[taskName] = uniqueTaskProps;
            }
        }
        return uniqueTasks;
    }

    #countSyntacticFeature(task, feature) {
        const func = task.getFunction();
        if (func == null) {
            return -1;
        }

        if (feature != "loop" && feature != "while") {
            const cnt = Query.searchFrom(func, feature).chain();
            return cnt.length;
        }
        else {
            let cnt = 0;
            for (const loop of Query.searchFrom(func, "loop")) {
                if (feature == "loop") {
                    if (loop.kind == "for" || loop.kind == "foreach") {
                        cnt++;
                    }
                }
                if (feature == "while") {
                    if (loop.kind == "while" || loop.kind == "dowhile") {
                        cnt++;
                    }
                }
            }
            return cnt;
        }
    }

    #countStaticLoops(task) {
        const func = task.getFunction();
        if (func == null) {
            return -1;
        }

        let staticCnt = 0;
        let totalCnt = 0;

        for (const loop of Query.searchFrom(func, "loop")) {
            const tripCount = LoopCharacterizer.characterize(loop).count;

            if (tripCount != -1) {
                staticCnt++;
            }
            totalCnt++;
        }
        if (totalCnt == 0) {
            return "N/A";
        }
        return staticCnt / totalCnt;
    }
}