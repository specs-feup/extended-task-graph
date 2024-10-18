import { Call, FloatLiteral, IntLiteral, Literal, Type, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import { DataItemOrigin } from "./DataItemOrigin.js";
import { ClavaUtils } from "../util/ClavaUtils.js";

export class DataItem {
    private ref: Vardecl | null = null;
    private literal: Literal | null = null;

    private name: string = "<no_name>";
    private isInit: boolean = false;
    private dataIsWritten: boolean = false;
    private dataIsRead: boolean = false;

    private dataIsScalar: boolean = false;
    private dims: number[] = [];
    private sizeInBytes: number = -1;
    private datatype: string = "<no_type>";
    private datatypeSize: number = 4;

    private itemOrigin: DataItemOrigin = DataItemOrigin.NEW;
    private alternateName: string = "<no_alt_name>";
    private immediateFunctionCall: Call | null = null;

    constructor(ref: Vardecl | Literal, origin: DataItemOrigin) {
        if (ref instanceof Vardecl) {
            const vardecl = ref as Vardecl;

            this.ref = vardecl;
            this.name = vardecl.name;
            this.demangleDatatype(vardecl.type);
        }
        if (ref instanceof IntLiteral || ref instanceof FloatLiteral) {
            const lit = ref as Literal;

            this.literal = lit;
            this.name = "imm(" + ref.value + ")";
            this.demangleDatatype(lit.type);
        }
        this.itemOrigin = origin;
        this.alternateName = this.name;
    }

    public getName(): string {
        return this.name;
    }

    public getItemOriginType(): DataItemOrigin {
        return this.itemOrigin;
    }

    public getDecl(): Vardecl | null {
        return this.ref;
    }

    public getLiteral(): Literal | null {
        return this.literal;
    }

    public getDatatype(): string {
        return this.datatype;
    }

    public getDimensions(): number[] {
        return this.dims;
    }

    public getAlternateName(): string {
        return this.alternateName;
    }

    public getSizeInBytes(): number {
        return this.sizeInBytes;
    }

    public setAlternateName(name: string) {
        this.alternateName = name;
    }

    public setWritten(): void {
        this.isInit = true;
        this.dataIsWritten = true;
    }

    public setRead(): void {
        this.isInit = true;
        this.dataIsRead = true;
    }

    public setInitialized(): void {
        this.isInit = true;
    }

    public isWritten(): boolean {
        return this.dataIsWritten;
    }

    public isRead(): boolean {
        return this.dataIsRead;
    }

    public isInitialized(): boolean {
        return this.isInit;
    }

    public isOnlyRead(): boolean {
        return this.dataIsRead && !this.dataIsWritten;
    }

    public isOnlyWritten(): boolean {
        return !this.dataIsRead && this.dataIsWritten;
    }

    public getDatatypeSize(): number {
        return this.datatypeSize;
    }

    public getImmediateFunctionCall(): Call | null {
        return this.immediateFunctionCall;
    }

    public setImmediateFunctionCall(call: Call): void {
        if (this.itemOrigin !== DataItemOrigin.CONSTANT) {
            throw new Error("You can only specify an immediate function call for immediate constants!");
        }
        this.immediateFunctionCall = call;
    }

    public isNewlyCreated(): boolean {
        return this.itemOrigin === DataItemOrigin.NEW;
    }

    public isFromParam(): boolean {
        return this.itemOrigin === DataItemOrigin.PARAM;
    }

    public isFromGlobal(): boolean {
        return this.itemOrigin === DataItemOrigin.GLOBAL_REF;
    }

    public isConstant(): boolean {
        return this.itemOrigin === DataItemOrigin.CONSTANT;
    }

    public isScalar(): boolean {
        return this.dataIsScalar;
    }

    public toString(): string {
        const status = !this.isInit ? "U" : (this.dataIsRead ? "R" : "") + (this.dataIsWritten ? "W" : "");
        const refName = this.ref ? this.ref.name : "<null_ref>";
        return `${refName} {${this.sizeInBytes}} ${status}`;
    }

    private demangleDatatype(type: Type): void {
        const typeCode = type.code;

        if (type.isArray) {
            this.demangleArray(typeCode);
        }
        else if (type.isPointer) {
            this.demanglePointer(typeCode);
        }
        else {
            this.demangleScalar(typeCode);
        }
    }

    private demangleScalar(typeCode: string): void {
        this.datatype = typeCode;
        this.datatypeSize = ClavaUtils.getDatatypeSize(typeCode);
        this.sizeInBytes = this.datatypeSize;
        this.dataIsScalar = true;
    }

    private demanglePointer(typeCode: string): void {
        const datatype = typeCode.substring(0, typeCode.indexOf("*"));
        const datatypeSize = ClavaUtils.getDatatypeSize(datatype);

        const match = typeCode.match(/\*/g);
        const refCount = match ? match.length : 0;
        const dims = Array.from({ length: refCount }, () => -1);

        this.dims = dims;
        this.datatype = datatype;
        this.datatypeSize = datatypeSize;
        this.dataIsScalar = false;
    }

    private demangleArray(typeCode: string): void {
        const datatype = typeCode.substring(0, typeCode.indexOf("["));
        const datatypeSize = ClavaUtils.getDatatypeSize(datatype);

        const dimsStr = typeCode.substring(typeCode.indexOf("[") + 1);
        if (!dimsStr.startsWith("]")) {
            const match = dimsStr.match(/\d+/g);
            const dims = match != null ? match.map(Number) : [];
            let size = 0;
            for (const dim of dims) {
                size += dim * datatypeSize;
            }
            this.dims = dims;
            this.sizeInBytes = size;
        }

        this.datatype = datatype;
        this.datatypeSize = datatypeSize;
        this.dataIsScalar = false;
    }
}