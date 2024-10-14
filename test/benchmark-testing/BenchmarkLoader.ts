import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import Io from "@specs-feup/lara/api/lara/Io.js";
import { JavaClasses } from "@specs-feup/lara/api/lara/util/JavaTypes.js";

export class BenchmarkLoader {
    static load(suite: BenchmarkSuite, app: string): boolean {
        const summary = suite.apps[app];
        const fullPath = `${suite.path}${app}`;

        if (!Io.isFolder(fullPath)) {
            console.error(`Benchmark folder not found: ${fullPath}`);
            console.log("Have you cloned the submodule github.com/specs-feup/clava-benchmarks?");
            return false;
        }

        const sources: string[] = [];
        for (const file of Io.getFiles(fullPath)) {
            if ([".c", ".cpp", ".h", ".hpp"].some(char => file.endsWith(char))) {
                sources.push(`${fullPath}/${file.name}`);
            }
        }
        console.log(`Found ${sources.length} files for ${app}`);

        Clava.pushAst(ClavaJoinPoints.program());
        for (const source of sources) {
            const fileJp = ClavaJoinPoints.file(source);
            Clava.addFile(fileJp);
        }
        return true;
    }
}

export type BenchmarkSuite = {
    name: string,
    path: string,
    apps: Record<string, AppSummary>
};

export type AppSummary = {
    standard: string,
    topFunction: string,
    input?: string,
    alternateTopFunction?: string
}