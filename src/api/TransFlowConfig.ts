import { SubsetPreprocessor } from "../preprocessing/subset/SubsetPreprocessor.js";
import { SubsetTransform } from "../preprocessing/subset/SubsetTransforms.js";

export class TransFlowConfig {
    dumpCallGraph: boolean = true;
    dumpAST: boolean = true;
    doTransforms: boolean = true;
    silentTransforms: boolean = false;
    transformRecipe: SubsetTransform[] = SubsetPreprocessor.DEFAULT_RECIPE;
}