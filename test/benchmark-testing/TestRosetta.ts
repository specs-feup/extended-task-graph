import { AppSummary } from "./AppSummary.js";

const apps: Record<string, AppSummary> = {
    "3d-rendering": { standard: "c++11", topFunction: "rendering_sw" },
    "digit-recognition": { standard: "c++11", topFunction: "DigitRec_sw" },
    "face-detection": { standard: "c++11", topFunction: "face_detect_sw" },
    "optical-flow": { standard: "c++11", topFunction: "optical_flow_sw" },
    "spam-filter": { standard: "c++11", topFunction: "SgdLR_sw", alternateTopFunction: "main" }
};

