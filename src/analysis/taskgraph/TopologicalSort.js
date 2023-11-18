class TopologicalSort {
    constructor(tasks) {
        this.tasks = tasks;
        this.visited = new Set();
        this.sortedTasks = [];
    }

    performSort() {
        this.tasks.forEach(task => {
            const taskId = task.getId();
            if (!this.visited.has(taskId)) {
                this.#dfs(task);
            }
        });

        return this.sortedTasks.reverse();
    }

    #dfs(task) {
        this.visited.add(task.getId());

        task.getOutgoingComm().forEach(edge => {
            const targetId = edge.getTarget().getId();
            if (!this.visited.has(targetId)) {
                this.#dfs(edge.getTarget());
            }
        });

        this.sortedTasks.push(task);
    }
}
