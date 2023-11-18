"use strict";

laraImport("taskgraph/TaskGraph");
laraImport("analysis/taskgraph/ParallelTaskFinder");
laraImport("analysis/taskgraph/ProducerConsumerFinder");
laraImport("weaver.Query");

class TaskGraphAnalyzer extends UPTStage {
    #taskGraph;
    #metrics = {};

    constructor(topFunction, outputDir, appName, taskGraph) {
        super("HPFlow-TaskGraphAnalyzer", topFunction, outputDir, appName);

        this.#metrics["appName"] = appName;
        this.#taskGraph = taskGraph;
    }

    getMetrics() {
        return this.#metrics;
    }

    getMetricsAsJson() {
        return JSON.stringify(this.#metrics, null, 4);
    }

    saveMetrics() {
        const jsonMetrics = this.getMetricsAsJson();
        const fname = this.saveToFile(jsonMetrics, "task_graph_metrics.json");
        this.log(`Saved task graph metrics to file "${fname}"`);
    }

    updateMetrics() {
        // need to break this apart!
        this.#calculateTaskStats();
        this.#calculateUniqueTasks();
        this.#calculateInlinableHistogram();
        this.#calculateDataPerTask();
        this.#calculateGlobalData();
        this.#calculateDataSourceDistance();

        // parallel tasks
        this.#calculateParallelTasks();

        // producer-consumer
        this.#calculateProducerConsumer();

        return this.#metrics;
    }

    #calculateParallelTasks() {
        const ptf = new ParallelTaskFinder();
        const taskPairs = ptf.findTaskPairs(this.#taskGraph);
        const parallelTasks = ptf.getPairToParallelMap(taskPairs);

        this.#metrics["parallelTasks"] = parallelTasks;
    }

    #calculateProducerConsumer() {
        const pcf = new ProducerConsumerFinder();
        const taskPairs = pcf.findTaskPairs(this.#taskGraph);
        const producerConsumer = pcf.getPairToProducerConsumerMap(taskPairs);

        this.#metrics["producerConsumer"] = producerConsumer;
    }

    #calculateTaskStats() {
        const taskTypes = {};
        let externalCnt = 0;
        let regularCnt = 0;

        const tasks = this.#taskGraph.getTasks();
        for (const task of tasks) {
            const taskName = task.getFunction().name;
            const taskType = task.getType();
            taskTypes[taskName] = taskType;

            if (taskType === "EXTERNAL") {
                externalCnt++;
            }
            if (taskType === "REGULAR") {
                regularCnt++;
            }
        }

        const nTasks = regularCnt + externalCnt;
        const nEdges = this.#taskGraph.getCommunications().length;
        const nInlinables = this.#taskGraph.getInlinables().length;
        const nGlobals = this.#taskGraph.getGlobalTask().getData().length;

        this.#metrics["counts"] = {
            "#tasks": nTasks,
            "#edges": nEdges,
            "externalTasks": externalCnt,
            "regularTasks": regularCnt,
            "inlinableCalls": nInlinables,
            "globalVars": nGlobals,

        };
        this.#metrics["uniqueTaskTypes"] = taskTypes;
    }

    #calculateUniqueTasks() {
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

        this.#metrics["uniqueTaskInstances"] = uniqueTasks;
    }

    #countStatements(task) {
        const func = task.getFunction();
        if (func == null) {
            return -1;
        }
        const cnt = Query.searchFrom(func, "statement").chain();
        return cnt.length;
    }

    #calculateInlinableHistogram() {
        const hist = {};
        for (const inlinable of this.#taskGraph.getInlinables()) {
            const inlinableName = inlinable.name;
            println(inlinableName);

            if (inlinableName in hist) {
                hist[inlinableName]++;
            }
            else {
                hist[inlinableName] = 1;
            }
        }
        this.#metrics["noTaskCallsHistogram"] = hist;
    }

    #calculateDataPerTask() {
        const dataPerTask = {};
        const tasks = this.#taskGraph.getTasks();

        for (const task of tasks) {
            const taskData = {};

            for (const datum of task.getData()) {
                const datumProps = {
                    "origin": datum.getOriginType(),
                    "sizeInBytes": datum.getSizeInBytes(),
                    "cxxType": datum.getDatatype(),
                    "isScalar": datum.isScalar(),
                    "alternateName": datum.getAlternateName(),
                    "stateChanges": {
                        "isInit": datum.isInitialized(),
                        "isWritten": datum.isWritten(),
                        "isRead": datum.isRead()
                    }
                }
                taskData[datum.getName()] = datumProps;
            }
            const taskName = task.getUniqueName();
            dataPerTask[taskName] = taskData;
        }
        this.#metrics["dataPerTask"] = dataPerTask;
    }

    #calculateGlobalData() {
        const globalData = {};
        const globalTask = this.#taskGraph.getGlobalTask();

        for (const datum of globalTask.getData()) {
            const datumProps = {
                "origin": datum.getOriginType(),
                "sizeInBytes": datum.getSizeInBytes(),
                "cxxType": datum.getDatatype(),
                "isScalar": datum.isScalar(),
                "alternateName": datum.getAlternateName(),
                "stateChanges": {
                    "isInit": datum.isInitialized(),
                    "isWritten": datum.isWritten(),
                    "isRead": datum.isRead()
                }
            }
            globalData[datum.getName()] = datumProps;
        }
        this.#metrics["globalData"] = globalData;
    }

    #calculateDataSourceDistance() {
        const dataSourceDistance = {};
        const tasks = this.#taskGraph.getTasks();

        for (const task of tasks) {
            const commOfTask = {};

            for (const datum of task.getData()) {
                const pathAndEvo = this.#calculateDistanceToOrigin(datum, task);
                const path = pathAndEvo[0];
                const dataEvo = pathAndEvo[1];
                commOfTask[datum.getName()] = { "pathToOrigin": path, "dataEvolution": dataEvo, "distanceToOrigin": path.length };
            }
            const taskName = task.getUniqueName();
            dataSourceDistance[taskName] = commOfTask;
        }
        this.#metrics["dataSourceDistance"] = dataSourceDistance;
    }

    #calculateDistanceToOrigin(datum, task) {
        const path = [task.getUniqueName()];
        const dataEvo = [datum.getName()];

        if (task.getType() === "GLOBAL" || task.getType() === "START") {
            return [path, dataEvo];
        }
        if (datum.isNewlyCreated()) {
            return [path, dataEvo];
        }
        else {
            const comm = task.getIncomingOfData(datum);
            if (comm == null) {
                println("ERROR: No incoming communication found for data " + datum.getName() + " of task " + task.getUniqueName());
                return [path, dataEvo];
            }
            else {
                const srcTask = comm.getSource();
                const srcDatum = comm.getSourceData();

                const remaining = this.#calculateDistanceToOrigin(srcDatum, srcTask);
                const remainingPath = remaining[0];
                const remainingDataEvo = remaining[1];

                path.push(...remainingPath);
                dataEvo.push(...remainingDataEvo);
                return [path, dataEvo];
            }
        }
    }
}