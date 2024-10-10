import { TaskGraph } from "../../taskgraph/TaskGraph.js";
import { TaskGraphStatGatherer } from "./TaskGraphStatGatherer.js";
import LoopCharacterizer from "clava-code-transformations/LoopCharacterizer";
import { ExternalTask } from "../../taskgraph/tasks/ExternalTask.js";
import { RegularTask } from "../../taskgraph/tasks/RegularTask.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { If, Loop, Statement, Switch } from "@specs-feup/clava/api/Joinpoints.js";

export class TaskPropertiesFinder extends TaskGraphStatGatherer {

    constructor(taskGraph: TaskGraph) {
        super("uniqueTaskInstances", taskGraph);
    }

    getStatSummary(): Record<string, any> {
        const uniqueTasks: Record<string, Record<string, any>> = {};
        const tasks = this.getTaskGraph().getTasks();

        for (const task of tasks) {
            const taskName = task.getName();
            const taskReps = task.getRepetitions();

            if (taskName in uniqueTasks) {
                uniqueTasks[taskName]["instances"].push(taskReps);
            }
            else {
                const uniqueTaskProps: Record<string, any> = {};

                if (task instanceof ExternalTask) {
                    uniqueTaskProps["instances"] = [taskReps];
                    uniqueTaskProps["#statements"] = -1;
                    uniqueTaskProps["#loops"] = -1;
                    uniqueTaskProps["#whiles"] = -1;
                    uniqueTaskProps["#ifs"] = -1;
                    uniqueTaskProps["#switches"] = -1;
                    uniqueTaskProps["perLoopsStaticCounts"] = -1;
                }
                if (task instanceof RegularTask) {
                    uniqueTaskProps["instances"] = [taskReps];
                    uniqueTaskProps["#statements"] = this.#countSyntacticFeature(task, "statement");
                    uniqueTaskProps["#loops"] = this.#countSyntacticFeature(task, "loop");
                    uniqueTaskProps["#whiles"] = this.#countSyntacticFeature(task, "while");
                    uniqueTaskProps["#ifs"] = this.#countSyntacticFeature(task, "if");
                    uniqueTaskProps["#switches"] = this.#countSyntacticFeature(task, "switch");
                    uniqueTaskProps["perLoopsStaticCounts"] = this.#countStaticLoops(task);

                }
                uniqueTasks[taskName] = uniqueTaskProps;
            }
        }
        return uniqueTasks;
    }

    #countSyntacticFeature(task: RegularTask, feature: string): number {
        const func = task.getFunction();
        let cnt = 0;

        if (feature == "statement") {
            cnt = Query.searchFrom(func, Statement).chain().length;
        }
        if (feature == "if") {
            cnt = Query.searchFrom(func, If).chain().length;
        }
        if (feature == "switch") {
            cnt = Query.searchFrom(func, Switch).chain().length;
        }
        if (feature == "loop" || feature == "while") {
            for (const loop of Query.searchFrom(func, Loop)) {
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
        }
        return cnt;
    }

    #countStaticLoops(task: RegularTask): number {
        const func = task.getFunction();

        let staticCnt = 0;
        let totalCnt = 0;

        for (const loop of Query.searchFrom(func, Loop)) {
            const tripCount = LoopCharacterizer.characterize(loop).tripCount;

            if (tripCount != -1) {
                staticCnt++;
            }
            totalCnt++;
        }
        if (totalCnt == 0) {
            return -1;
        }
        return staticCnt / totalCnt;
    }
}