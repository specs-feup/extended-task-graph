import { Task } from "../tasks/Task.js";

export class TopologicalSort {
    public static sort(tasks: Task[]): Task[] {
        const visited: Set<string> = new Set();
        const result: Set<Task> = new Set();
        const taskIds: Set<string> = new Set(tasks.map((task) => task.getId()));

        const dfs = (task: Task) => {
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

        tasks.forEach((task: Task) => {
            if (!visited.has(task.getId())) {
                dfs(task);
            }
        });

        return Array.from(result).reverse(); // Return the reversed result as an array
    }
}