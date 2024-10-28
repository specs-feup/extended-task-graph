import { AstDumper } from "./AstDumper.js";

export class AstPlaintextConverter extends AstDumper {
    protected levelEntry(label: string, indent: number): string {
        return `${'-'.repeat(indent)}>${label}\n`;
    }
    protected levelPrologue(): string {
        return "";
    }
    protected levelEpilogue(): string {
        return "";
    }

    public getFileExtension(): string {
        return "txt";
    }

}