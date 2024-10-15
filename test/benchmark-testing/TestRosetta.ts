import { LiteBenchmarkLoader, BenchmarkSuite } from "./BenchmarkLoader.js";
import { SuiteSelector } from "./SuiteSelector.js";

const rosettaSuite: BenchmarkSuite = SuiteSelector.ROSETTA;
const topFun = LiteBenchmarkLoader.load(rosettaSuite, "spam-filter");