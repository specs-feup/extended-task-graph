import { RegularTask } from "../tasks/RegularTask.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { FileJp, FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";

export class ClusterExtractor {
    constructor() { }

    public extractCluster(task: RegularTask, fileName?: string): boolean {
        const fun = task.getFunction();
        const originalFile = fun.getAncestor("file") as FileJp;

        if (fileName == undefined) {
            fileName = `${fun.name}.${ClavaUtils.getCurrentFileExt()}`
        }
        else {
            if (!fileName.includes(".")) {
                fileName = `${fileName}.${ClavaUtils.getCurrentFileExt()}`
            }
            else if (!fileName.endsWith(`.${ClavaUtils.getCurrentFileExt()}`)) {
                const ext = fileName.split(".").pop();
                console.log(`[ClusterExtractor] Error: File extension ${ext} does not match the current file extension, aborting...`);
                return false;
            }
        }

        const decl = fun.getDeclaration(true);
        const declStmt = ClavaJoinPoints.stmtLiteral(`extern ${decl};`);
        const call = task.getCall()!;
        const callFun = call.function;
        callFun.insertBefore(declStmt);

        const subDir = originalFile.sourceFoldername;
        const fileJp = ClavaJoinPoints.file(fileName, subDir);
        Clava.addFile(fileJp);

        const funs = this.getAllFunctionsInCluster(task);

        this.moveToNewFile(funs, fileJp);

        return true;
    }

    private getAllFunctionsInCluster(task: RegularTask): FunctionJp[] {
        const funs: FunctionJp[] = [task.getFunction()];

        for (const child of task.getHierarchicalChildren()) {
            if (child instanceof RegularTask) {
                funs.push(...this.getAllFunctionsInCluster(child));
            }
        }
        return funs;
    }

    private moveToNewFile(funs: FunctionJp[], fileJp: FileJp): void {
        for (const fun of funs) {
            fileJp.insertBegin(fun);
            fun.detach();
        }
    }
}