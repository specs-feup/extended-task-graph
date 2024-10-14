import { BenchmarkSuite } from "./BenchmarkLoader.js";

const chstoneSuite: BenchmarkSuite = {
    name: "CHStone",
    path: "clava-benchmarks/CHStone/lara/benchmark/",
    apps: {
        "adpcm": { standard: "c11", topFunction: "adpcm_main" },
        "aes": { standard: "c11", topFunction: "aes_main" },
        "blowfish": { standard: "c11", topFunction: "blowfish_main" },
        "dfadd": { standard: "c11", topFunction: "float64_add" },
        "dfdiv": { standard: "c11", topFunction: "float64_div" },
        "dfmul": { standard: "c11", topFunction: "float64_mul" },
        "dfsin": { standard: "c11", topFunction: "_sin" },
        "gsm": { standard: "c11", topFunction: "Gsm_LPC_Analysis" },
        "jpeg": { standard: "c11", topFunction: "jpeg2bmp_main" },
        "mips": { standard: "c11", topFunction: "mips" },
        "motion": { standard: "c11", topFunction: "main" },
        "sha": { standard: "c11", topFunction: "sha_stream" }
    }
}