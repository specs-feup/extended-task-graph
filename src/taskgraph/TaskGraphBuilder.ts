import { Call, FunctionJp, If, Joinpoint, Loop, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { AStage } from "../AStage.js";
import { TaskGraph } from "./TaskGraph.js";
import { Task } from "./tasks/Task.js";
import { RegularTask } from "./tasks/RegularTask.js";
import { ClavaUtils } from "../util/ClavaUtils.js";
import { ExternalFunctionsMatcher } from "../util/ExternalFunctionsMatcher.js";
import { ExternalTask } from "./tasks/ExternalTask.js";
import { DataItem } from "./dataitems/DataItem.js";
import { ConcreteTask } from "./tasks/ConcreteTask.js";
import { LoopCharacterizer } from "@specs-feup/clava-code-transforms/LoopCharacterizer";
import { VariableDataItem } from "./dataitems/VariableDataItem.js";

export class TaskGraphBuilder extends AStage {
    private lastUsedGlobal = new Map();

    constructor(topFunction: string, outputDir: string, appName: string) {
        super("GenFlow-TaskGraphBuilder", topFunction, outputDir, appName);
    }

    public build(): TaskGraph {
        const taskGraph = new TaskGraph();
        this.populateGlobalMap(taskGraph);

        const topFunctionJoinPoint = this.getTopFunctionJoinPoint();
        const topTask = this.buildLevel(taskGraph, topFunctionJoinPoint, null, null, true);

        let rank = 1;
        for (const dataItem of topTask.getParamData()) {
            const sourceTask = taskGraph.getSourceTask();
            const itemInSource = sourceTask.addDataToSource(dataItem);

            taskGraph.addCommunication(sourceTask, topTask, itemInSource, dataItem, rank);
            rank++;
        }
        for (const dataItem of topTask.getGlobalRefData()) {
            const globalTask = taskGraph.getGlobalTask();
            const itemInGlobal = globalTask.getDataItemByName(dataItem.getName())!;

            taskGraph.addCommunication(globalTask, topTask, itemInGlobal, dataItem, rank);
            this.lastUsedGlobal.set(dataItem.getName(), topTask);
            rank++;
        }
        rank = 1;
        const sinkTask = taskGraph.getSinkTask();
        for (const dataItem of topTask.getDataWritten()) {
            if (dataItem instanceof VariableDataItem) {
                const itemInSink = sinkTask.addDataToSink(dataItem as VariableDataItem);
                taskGraph.addCommunication(topTask, sinkTask, dataItem, itemInSink, rank);
                rank++;
            }
        }
        this.setTaskUniqueness(taskGraph);

        return taskGraph;
    }

    private setTaskUniqueness(taskGraph: TaskGraph): void {
        const signatures: { [signature: string]: number } = {};

        taskGraph.getTasks().forEach((task) => {
            if (taskGraph instanceof RegularTask) {
                const signature = task.getCall()?.signature;
                if (!signature) {
                    return;
                }
                if (signatures[signature]) {
                    signatures[signature]++;
                } else {
                    signatures[signature] = 1;
                }
            }
        });
        taskGraph.getTasks().forEach((task) => {
            if (task instanceof RegularTask) {
                const signature = task.getCall()?.signature;
                if (!signature) {
                    return;
                }
                if (signatures[signature] > 1) {
                    task.setSharesFunction(true);
                }
            }
        });
        Object.entries(signatures).forEach(([signature, count]) => {
            if (count > 1) {
                console.log(`Function ${signature.split("(")[0]} is shared by ${count} tasks`);
            }
        });
    }

    private populateGlobalMap(taskGraph: TaskGraph): void {
        const globalTask = taskGraph.getGlobalTask();

        for (const dataItem of globalTask.getGlobalDeclData()) {
            // Assume that it is always initialized
            // We can decide on a better policy later
            this.lastUsedGlobal.set(dataItem.getName(), globalTask);
        }
    }

    private buildLevel(taskGraph: TaskGraph, fun: FunctionJp, parent: ConcreteTask | null, call: Call | null, firstLevel: boolean = false): Task {
        const task = new RegularTask(call, fun, parent);
        if (!firstLevel) {
            this.updateWithRepetitions(task, call);
            this.addControlEdges(task, call, taskGraph);
        }
        taskGraph.addTask(task);

        const childTasks: Task[] = [];

        for (const call of Query.searchFrom(fun, Call)) {
            const callee = call.function;

            // Is of type "REGULAR", handle recursively
            if (ClavaUtils.functionHasImplementation(callee)) {
                const regularTask = this.buildLevel(taskGraph, callee, task, call);

                task.addHierarchicalChild(regularTask as ConcreteTask);
                childTasks.push(regularTask);
            }

            // Is of type "EXTERNAL", create it on the spot
            else if (!ExternalFunctionsMatcher.isValidExternal(callee)) {
                const externalTask = new ExternalTask(call, task);

                this.updateWithRepetitions(task, call);
                this.addControlEdges(externalTask, call, taskGraph);

                task.addHierarchicalChild(externalTask);
                taskGraph.addTask(externalTask);
                childTasks.push(externalTask);
            }

            // Should only happen for inlinable functions (e.g., math.h)
            else {
                taskGraph.addInlinable(call);
            }
        }

        // Add communications
        this.addSubgraphComm(taskGraph, task, childTasks);

        // Update task with R/W data from the children
        this.updateTaskWithChildrenData(task, childTasks);

        // Update task with interface names
        task.updateDataItemInterfaces();
        return task;
    }

    private addControlEdges(task: Task, call: Call | null, taskGraph: TaskGraph): void {
        const ifStmts: Joinpoint[] = [];
        const conditions: boolean[] = [];

        if (call == null) {
            this.log("addControlEdges: Call is null, skipping");
            return;
        }
        let child: Joinpoint = call;
        let parent: Joinpoint = call.parent;

        do {
            if (parent instanceof If) {
                ifStmts.push(parent);
                // true if child is the "then" branch (children[1])
                // false if child is the "else" branch (children[2])
                conditions.push(parent.children[1].astId == child.astId);
            }
            child = parent;
            parent = child.parent;
        } while (!(parent instanceof FunctionJp));

        for (let i = 0; i < ifStmts.length; i++) {
            const ifStmt = ifStmts[i];
            const condition = conditions[i];

            const varref = ifStmt.children[0] as Varref;
            const varrefName = varref.name;

            // horrible hack: we need to find the last task
            // that defines the control variable, but we 
            // are not exactly keeping track of that
            // so we just go through every task and find the 
            // last one to use the variable
            let condTask: ConcreteTask | null = null;
            for (const task of taskGraph.getTasks()) {
                for (const data of task.getData()) {
                    if (data.getName() == varrefName) {
                        condTask = task;
                    }
                }
            }
            if (condTask == null) {
                this.log("Could not find task that defines the control variable " + varrefName);
                continue;
            }
            // end of horrible hack
            taskGraph.addControlEdge(condTask, task, varref, condition);
        }
    }

    private updateWithRepetitions(task: ConcreteTask, call: Call | null): void {
        if (call == null) {
            this.log("updateWithRepetitions: Call is null, skipping");
            return;
        }
        const body = call.parent.parent;
        if (body.parent instanceof Loop) {
            const loop = body.parent;
            const characterizer = new LoopCharacterizer();
            const characteristics = characterizer.characterize(loop);
            const iterCount = characteristics.tripCount == undefined ? -1 : characteristics.tripCount;

            task.setRepetitions(iterCount, loop);
            this.log("Task " + task.getUniqueName() + " has " + iterCount + " repetitions");
        }
    }

    private addSubgraphComm(taskGraph: TaskGraph, parent: Task, children: Task[]): void {
        // First, we start by building a handy mapping between task and task name
        const nameToTask = new Map();
        for (const task of children) {
            nameToTask.set(task.getUniqueName(), task);
        }
        nameToTask.set(parent.getUniqueName(), parent);

        // Then, we build a map of the last task that used each data item
        // (which, at the beginning, is the parent task itself)
        const lastUsed = new Map();
        for (const dataItem of parent.getData()) {
            lastUsed.set(dataItem.getName(), parent.getUniqueName());
        }

        for (const child of children) {
            let rank = 1;

            const childParams = child.getParamData();
            for (const dataItem of childParams) {
                this.buildCommParam(dataItem, lastUsed, nameToTask, child, taskGraph, rank);
                rank++;
            }

            const childGlobals = child.getGlobalRefData();
            for (const dataItem of childGlobals) {
                this.buildCommGlobal(dataItem, child, taskGraph, rank);
                rank++;
            }
        }
    }

    private buildCommParam(childDataItem: DataItem, lastUsed: Map<string, string>, nameToTask: Map<string, Task>, childTask: Task, taskGraph: TaskGraph, rank: number): void {
        const altName = childDataItem.getNameInPreviousTask();
        const lastUsedTaskName = lastUsed.get(altName)!;
        if (lastUsedTaskName == null) {
            this.logWarning(`No last used task found for data item ${altName} in task ${childTask.getUniqueName()}`);
            return;
        }
        const lastUsedTask = nameToTask.get(lastUsedTaskName)!;
        let lastUsedDataItem = lastUsedTask.getDataItemByName(altName);

        // This is potentially an issue if the alt name happens to match a completely different data item
        if (lastUsedDataItem == null) {
            lastUsedDataItem = lastUsedTask.getDataItemByPrevTaskName(altName);
        }
        if (lastUsedDataItem == null) {
            throw new Error(`Could not find data item ${altName} in task ${lastUsedTask.getUniqueName()}`);
        }

        if (lastUsedTask != null && lastUsedTask != childTask) {
            taskGraph.addCommunication(lastUsedTask, childTask, lastUsedDataItem, childDataItem, rank);

            if (childDataItem.isWritten()) {
                lastUsed.set(altName, childTask.getUniqueName());
            }
        }
    }

    // TODO: implement conditionals for this as well
    private buildCommGlobal(dataItem: DataItem, task: Task, taskGraph: TaskGraph, rank: number): void {
        const dataName = dataItem.getName();
        const lastUsedTask = this.lastUsedGlobal.get(dataName);

        if (lastUsedTask == null) {
            this.logWarning(`No last used global task found for data item ${dataName} in task ${task.getUniqueName()}`);
            return;
        }

        const dataItemInParent = lastUsedTask.getDataItemByName(dataName);

        if (lastUsedTask != null && lastUsedTask != task) {
            taskGraph.addCommunication(lastUsedTask, task, dataItemInParent, dataItem, rank);
        }
        if (dataItem.isWritten()) {
            this.lastUsedGlobal.set(dataName, task);
        }
    }

    private updateTaskWithChildrenData(task: Task, children: Task[]): void {
        const dataMap = task.getDataAsMap();

        for (const child of children) {
            for (const data of child.getParamData()) {
                const altName = data.getNameInPreviousTask();

                if (data.isWritten()) {
                    const dataItem = dataMap.get(altName);
                    if (dataItem != undefined) {
                        dataItem.setWritten();
                    }
                    else {
                        this.logWarning(`Data item ${altName} not found in task ${task.getUniqueName()} when updating with children data`);
                    }
                }
            }
        }
    }
}