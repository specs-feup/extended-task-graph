import { SubsetPreprocessor } from "../preprocessing/subset/SubsetPreprocessor.js";
import { SubsetTransform } from "../preprocessing/subset/SubsetTransforms.js";

export class TransFlowConfig {
    dumpCallGraph: boolean = true;
    dumpAST: boolean = true;
    doSubsetInterTransforms: boolean = true;
    doSubsetTaskTransforms: boolean = true;
    doInstrumentation: boolean = false;
    silentTransforms: boolean = false;
    transformRecipe: SubsetTransform[] = SubsetPreprocessor.DEFAULT_RECIPE;
}