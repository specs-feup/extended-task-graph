# Flextask

Flextask is an extension for the [Clava](https://github.com/specs-feup/clava) C/C++ to C/C++ Source-to-source compiler that creates a task graph for any generic C/C++ application. These task graphs are automatically analyzed and characterized by several metrics, and through a highly flexible granularity mechanism we can perform extensive graph operations, such as task merging, splitting and clustering, while always outputting valid and readable C/C++ source code.

### How to use

TBD

### Outputs

Under normal usage (i.e., running the entire flow from code preprocessing, task graph generation and subsequent statistical analysis) the extension outputs the following folders:

* **app_stats**

  * **original** - some metrics about the original application's source code, as well as its call graph and AST
  * **taskform** - same as the above, but after applying the code preprocessing transformations
* **src**
  * **original** - the source code of the original program. It differs from the input only in that all macros have been resolved
  * **taskform_partial** - the source code after the preprocessing transformations are applied, except for function outlining
  * **taskform_ready** - the source code after applying function outlining, i.e., a valid representation for generating task graphs
  * **taskform_ready_instrumented** - the same as the above, but with time measuring instrumentation for each function. Useful for profiling
* **taskgraph** - all the information about the task graph, including two dotfiles of the graph (one complete, the other simplified) and a JSON filled with statistical information about the graph
