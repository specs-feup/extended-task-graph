import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import Io from "@specs-feup/lara/api/lara/Io.js";
import { readdirSync } from "fs";

export class LiteBenchmarkLoader {
    static load(suite: BenchmarkSuite, app: string): string {
        const summary = suite.appDetails[app];
        const fullPath = `${suite.path}${app}`;

        Clava.getData().setStandard(summary.standard);
        Clava.getData().setFlags(suite.flags.join(" "));

        if (!Io.isFolder(fullPath)) {
            console.error(`Benchmark folder not found: ${fullPath}`);
            console.log("Have you cloned the submodule github.com/specs-feup/clava-benchmarks?");
            return "<none>";
        }

        const sources = LiteBenchmarkLoader.readSourcesInFolder(fullPath);
        console.log(`Found ${sources.length} files for ${app}`);

        Clava.pushAst(ClavaJoinPoints.program());
        for (const source of sources) {
            const fileJp = ClavaJoinPoints.file(source);
            Clava.addFile(fileJp);
        }
        Clava.rebuild();

        return summary.topFunction;
    }

    public static readSourcesInFolder(folderPath: string): string[] {
        const sources: string[] = [];

        try {
            const files = readdirSync(folderPath);
            for (const file of files) {
                if (typeof file === "string") {
                    if ([".c", ".cpp", ".h", ".hpp"].some(char => file.endsWith(char))) {
                        sources.push(`${folderPath}/${file}`);
                    }
                }
            }

        } catch (err) {
            console.error('Error reading files:', err);
        }
        return sources;
    }
}

export type BenchmarkSuite = {
    name: string,
    path: string,
    apps: string[],
    appDetails: Record<string, AppSummary>,
    flags: string[]
};

export type AppSummary = {
    standard: string,
    topFunction: string,
    input?: string,
    alternateTopFunction?: string
}