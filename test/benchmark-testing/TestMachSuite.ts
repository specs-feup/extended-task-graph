import { AppSummary } from "./AppSummary.js";

const apps: Record<string, AppSummary> = {
    "aes": { standard: "c11", topFunction: "aes256_encrypt_ecb" },
    "backprop": { standard: "c11", topFunction: "backprop" },
    "bfs-bulk": { standard: "c11", topFunction: "bfs" },
    "bfs-queue": { standard: "c11", topFunction: "bfs" },
    "fft-strided": { standard: "c11", topFunction: "fft" },
    "fft-transpose": { standard: "c11", topFunction: "fft1D_512" },
    "gemm-blocked": { standard: "c11", topFunction: "bbgemm" },
    "gemm-ncubed": { standard: "c11", topFunction: "gemm" },
    "kmp": { standard: "c11", topFunction: "kmp" },
    "md-grid": { standard: "c11", topFunction: "md" },
    "md-knn": { standard: "c11", topFunction: "md_kernel" },
    "nw": { standard: "c11", topFunction: "needwun" },
    "sort-merge": { standard: "c11", topFunction: "ms_mergesort" },
    "sort-radix": { standard: "c11", topFunction: "ss_sort" },
    "spmv-crs": { standard: "c11", topFunction: "spmv" },
    "spmv-ellpack": { standard: "c11", topFunction: "ellpack" },
    "stencil-2d": { standard: "c11", topFunction: "stencil" },
    "stencil-3d": { standard: "c11", topFunction: "stencil3d" },
    "viterbi": { standard: "c11", topFunction: "viterbi" }
}
