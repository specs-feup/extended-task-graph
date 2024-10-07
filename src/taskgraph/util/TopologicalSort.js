"use strict";

class TopologicalSort {
    static sort(tasks) {
        const visited = new Set();
        const result = new Set();
        const taskIds = new Set(tasks.map((task) => task.getId()));

        const dfs = (task) => {
            visited.add(task.getId());

            const outgoingComm = task.getOutgoingComm();
            outgoingComm.forEach((comm) => {
                const neighbor = comm.getTarget();

                if (!visited.has(neighbor.getId()) && taskIds.has(neighbor.getId())) {
                    dfs(neighbor);
                }
            });

            result.add(task);
        };

        tasks.forEach((task) => {
            if (!visited.has(task.getId())) {
                dfs(task);
            }
        });

        return Array.from(result).reverse(); // Return the reversed result as an array
    }
}