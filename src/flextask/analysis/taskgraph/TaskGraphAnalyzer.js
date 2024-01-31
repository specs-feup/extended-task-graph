"use strict";

laraImport("weaver.Query");
laraImport("flextask/taskgraph/TaskGraph");
laraImport("flextask/analysis/taskgraph/TaskGraphStatFinder");
laraImport("flextask/analysis/taskgraph/TaskPropertiesFinder");
laraImport("flextask/analysis/taskgraph/DataPerTaskFinder");
laraImport("flextask/analysis/taskgraph/NoTaskHistogramFinder");
laraImport("flextask/analysis/taskgraph/GlobalDataFinder");
laraImport("flextask/analysis/taskgraph/DataSourceFinder");
laraImport("flextask/analysis/taskgraph/ParallelTaskFinder");
laraImport("flextask/analysis/taskgraph/ProducerConsumerFinder");
laraImport("flextask/analysis/taskgraph/CriticalPathFinder");

class TaskGraphAnalyzer extends AStage {
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
        this.log(`Saved TG metrics to file "${fname}"`);
    }

    updateMetrics() {
        // Statistics of the task graph
        this.#calculateTaskStats();

        // Code properties of each task
        this.#calculateUniqueTasks();

        // Histogram of no-task function calls
        this.#calculateNoTaskHistogram();

        // Data per task
        this.#calculateDataPerTask();

        // Information about global data
        this.#calculateGlobalData();

        // Distance from a datum to its source
        this.#calculateDataSourceDistance();

        // Parallel tasks
        this.#calculateParallelTasks();

        // Producer-consumer relationships
        this.#calculateProducerConsumer();

        // Critical path / ILP measure
        this.#calculateCriticalPath();

        return this.#metrics;
    }

    #calculateTaskStats() {
        const tgStatFinder = new TaskGraphStatFinder(this.#taskGraph);
        const taskGraphStats = tgStatFinder.calculateTaskGraphStats();

        this.#metrics["counts"] = taskGraphStats["counts"];
        this.#metrics["uniqueTaskTypes"] = taskGraphStats["uniqueTaskTypes"];
    }

    #calculateUniqueTasks() {
        const taskPropFinder = new TaskPropertiesFinder(this.#taskGraph);
        const uniqueTasks = taskPropFinder.calculateUniqueTasks();

        this.#metrics["uniqueTaskInstances"] = uniqueTasks;
    }

    #calculateNoTaskHistogram() {
        const histFinder = new NoTaskHistogramFinder(this.#taskGraph);
        const hist = histFinder.calculateNoTaskHistogram();

        this.#metrics["noTaskCallsHistogram"] = hist;
    }

    #calculateDataPerTask() {
        const dataPerTaskFinder = new DataPerTaskFinder(this.#taskGraph);
        const dataPerTask = dataPerTaskFinder.calculateDataPerTask();

        this.#metrics["dataPerTask"] = dataPerTask;
    }

    #calculateGlobalData() {
        const globalDataFinder = new GlobalDataFinder(this.#taskGraph);
        const globalData = globalDataFinder.calculateGlobalData();

        this.#metrics["globalData"] = globalData;
    }

    #calculateDataSourceDistance() {
        const dataSourceFinder = new DataSourceFinder(this.#taskGraph);
        const dataSourceDistance = dataSourceFinder.calculateDataSourceDistance();

        this.#metrics["dataSourceDistance"] = dataSourceDistance;
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

    #calculateCriticalPath() {
        const cpf = new CriticalPathFinder();
        const criticalPaths = cpf.findCriticalPaths(this.#taskGraph);

        this.#metrics["criticalPaths"] = criticalPaths;
    }

}