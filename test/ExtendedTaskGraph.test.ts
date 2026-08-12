import { readFileSync } from "node:fs";
import { registerSourceCode } from "@specs-feup/lara/jest/jestHelpers.js";
import { ExtendedTaskGraphAPI } from "../src/api/ExtendedTaskGraphAPI.js";
import { GenFlowConfig } from "../src/api/GenFlowConfig.js";
import { TransFlowConfig } from "../src/api/TransFlowConfig.js";

const source = readFileSync(
    "inputs/cluster-scenario/ClusterScenario.cpp",
    "utf8",
);

describe("ExtendedTaskGraphAPI workflows", () => {
    registerSourceCode(source);

    test("runs the code transformation flow", () => {
        const config = new TransFlowConfig();
        config.dumpAST = false;
        config.dumpCallGraph = false;
        config.doSubsetInterTransforms = false;
        config.doSubsetTaskTransforms = false;

        const api = new ExtendedTaskGraphAPI(
            "start",
            "output/tests",
            "transformation-flow",
        );

        expect(api.runCodeTransformationFlow(config)).toBe(true);
    });

    test("builds a task graph from transformed code", () => {
        const api = new ExtendedTaskGraphAPI(
            "start",
            "output/tests",
            "task-graph-flow",
        );

        const transConfig = new TransFlowConfig();
        transConfig.dumpAST = false;
        transConfig.dumpCallGraph = false;
        transConfig.transformRecipe = [];

        expect(api.runCodeTransformationFlow(transConfig)).toBe(true);

        const config = new GenFlowConfig();
        config.dumpGraph = false;
        config.gatherMetrics = false;

        const taskGraph = api.runTaskGraphGenerationFlow(config);

        expect(taskGraph).not.toBeNull();
        expect(taskGraph!.getTasks().length).toBeGreaterThan(0);
        expect(taskGraph!.getTaskByName("fizzbuzz")).toBeDefined();
    });
});
