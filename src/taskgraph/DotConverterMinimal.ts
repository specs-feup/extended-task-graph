import { DotConverter } from "./DotConverter.js";

export class DotConverterMinimal extends DotConverter {

    constructor() {
        super();
    }

    public getLabelOfEdge(): string {
        return "";
    }

}