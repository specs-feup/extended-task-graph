import { AppSummary } from "./AppSummary.js";

const apps: Record<string, AppSummary> = {
    "blackscholes": { standard: "c++17", topFunction: "BlkSchlsEqEuroNoDiv" },
    "fft": { standard: "c++17", topFunction: "radix2DitCooleyTykeyFft" },
    "inversek2j": { standard: "c++17", topFunction: "main" },
    "jmeint": { standard: "c++17", topFunction: "main" },
    "jpeg": { standard: "c++17", topFunction: "main" },
    "kmeans": { standard: "c++17", topFunction: "segmentImage" },
    "sobel": { standard: "c++17", topFunction: "main" },
};