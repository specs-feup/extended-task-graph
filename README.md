# Extended Task Graph

The Extended Task Graph (previously known as _flextask_) is an extension for the [Clava](https://github.com/specs-feup/clava) C/C++ to C/C++ Source-to-source compiler, whose main purpose is generating a task graph for any generic C/C++ application. These task graphs are automatically analyzed and characterized by several metrics, and through a highly flexible granularity mechanism we can perform extensive graph operations, such as task merging, splitting and clustering, while always outputting valid and readable C/C++ source code.

This branch has the original version of the ETG, developed from April 2023 to July 2024. After that, the codebase was converted to TypeScript and the build system was moved to NPM. The default branch, _etg-legacy_, preserves the ETG extension as-is before the conversion was made and merged onto _main_. Development of the modern TypeScript version continues over at the main branch.

### How to use

We provide a high-level API for interacting with the ETG:

```
laraImport("flextask.FlextaskAPI");

const topFunctionName = "foo";
const outputDir = "output";
const appName = "testApp"

const api = new FlextaskAPI(topFunctionName, outputDir, appName);

// First, apply the code transformations required for generating a task graph
// You do not necessarily need to run this flow first if your code is already in a valid format
const success = api.runCodeTransformationFlow();

// The task graph generator assumes the current AST is in a valid post-transformation form
const taskGraph = api.runTaskGraphGenerationFlow();

// Or, alternatively, to do both in one go with api.runBothFlows()
```

### Outputs

Under normal usage (i.e., running the entire flow from code preprocessing, task graph generation and subsequent extraction of metrics) the extension outputs the following folders:

* **ast**
  * **original** - some metrics about the original application's source code, as well as its call graph and AST
  * **transformed** - same as the above, but after applying all code preprocessing transformations
* **src**
  * **original** - the source code of the original program. It differs from the input only in that all macros have been resolved
  * **subset** - the source code after the preprocessing transformations are applied, except for function outlining
  * **transformed** - the source code after applying function outlining, i.e., a valid representation for generating task graphs
  * **transformed_instrumented** - the same as the above, but with time measuring instrumentation for each function. Useful for profiling
* **taskgraph** - all the information about the task graph, including two dotfiles of the graph (one complete, the other simplified) and a JSON filled with statistical information about the graph
