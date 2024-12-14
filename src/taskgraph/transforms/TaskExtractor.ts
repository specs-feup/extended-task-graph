import { RegularTask } from "../tasks/RegularTask.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import { FileJp, FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import { AExtractor } from "./AExtractor.js";

export class TaskExtractor extends AExtractor {

    public extractTask(task: RegularTask, clusterName: string = "cluster0", fileName?: string): FunctionJp | null {
        if (fileName == undefined) {
            fileName = `${clusterName}.${ClavaUtils.getCurrentFileExt()}`;
        }
        const fun = task.getFunction();
        const originalFile = fun.getAncestor("file") as FileJp;
        const subDir = originalFile.sourceFoldername;

        const fileJp = this.createFile(fileName, subDir);

        const call = task.getCall()!;
        const funs = this.getAllFunctionsInTask(task);

        const entrypoint = this.moveToNewFile(funs, fileJp, clusterName);

        this.addClusterSwitch(call, clusterName);

        const wrapper = this.createWrappedFunction(call, entrypoint, clusterName);

        this.createExternGlobalRefs(fileJp);

        this.copyIncludes(fileJp, originalFile);

        return wrapper;
    }
}