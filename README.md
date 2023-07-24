# UnnamedPartitioningTool

UPT is a tool that takes in any C/C++ application and accelerates its execution time by finding and optimizing regions to be offloaded to an FPGA. It completely automates the process of partitioning the application, optimizing the FPGA regions, and creating the final executable and bitstream bundle by calling Xilinx's tools.

## UPT system requirements

UPT has been developed with Linux (and more specifically Ubuntu) in mind. While it is also capable of partially running on both Windows and MacOS, we strongly suggest you stick with Linux, as this guide is written entirely with that in mind.

UPT requires several programs to be available on the system's path:

* `clava`: the Clava C/C++ to C/C++ Source-to-Source compiler is at the core of UPT, and is therefore mandatory. You can download it [from here](https://github.com/specs-feup/clava).

* `java`: any modern-ish version should do, e.g., `sudo apt install openjdk-21-jre-headless`

* `perf`: this is only needed if you want to run the profiling step. Install it with `sudo apt install linux-tools-common`.

* `vitis_hls` and `v++`: you need to have Vitis and Vitis HLS in the path if you want to target Xilinx FPGAs. Considering this is the only HLS target supported at this point, this is in practice mandatory. We recommend you to use the most recent versions possible, as we always use those to develop UPT.

Finally, UPT should have network access, as it may need to download additional files at runtime (e.g., system libraries).

## Testing infrastructure requirements

Besides the above requirements, our testing infrastructure expects `python` to be available in the system. More specifically, it expects `python`, and not `python3`. If this is an issue, you can get around it by running `sudo apt install python-is-python3`.
