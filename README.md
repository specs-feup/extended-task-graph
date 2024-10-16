# Extended Task Graph

This is an implementation of the [Extended Task Graph (ETG)](https://dl.acm.org/doi/abs/10.1145/3652032.3657580) intermediate representation for C/C++, built as an extension for the [Clava](https://github.com/specs-feup/clava) C/C++ to C/C++ Source-to-source compiler. Just like the compiler itself, it is packaged and distributed as an NPM package, which can be either used as a standalone app or as a library for other Clava-based NPM projects.

 These task graphs are automatically analyzed and characterized by several metrics, and through a highly flexible granularity mechanism we can perform extensive graph operations, such as task merging, splitting and clustering, while always outputting valid and readable C/C++ source code.

## How to use

TBD

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
