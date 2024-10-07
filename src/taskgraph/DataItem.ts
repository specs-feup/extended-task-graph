import { Call, FloatLiteral, IntLiteral, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import { DataItemOrigin } from "./DataItemOrigin.js";
import { ClavaUtils } from "../util/ClavaUtils.js";

export class DataItem {
    #ref: Vardecl;
    #name: string = "<no_name>";
    #isInit: boolean = false;
    #isWritten: boolean = false;
    #isRead: boolean = false;

    #isScalar: boolean = false;
    #dims: number[] = [];
    #sizeInBytes: number = -1;
    #datatype: string = "<no_type>";
    #datatypeSize: number = 4;

    #itemOrigin: DataItemOrigin = DataItemOrigin.NEW;
    #alternateName: string = "<no_alt_name>";
    #immediateFunctionCall: Call | null = null;

    constructor(ref: Vardecl, origin: DataItemOrigin) {
        this.#ref = ref;
        this.#itemOrigin = origin;
        this.#name = this.#getNameFromRef(ref);
        this.#alternateName = this.#name;
        this.#demangleDatatype(ref);
    }

    getName(): string {
        return this.#name;
    }

    getItemOriginType(): DataItemOrigin {
        return this.#itemOrigin;
    }

    getDecl(): Vardecl | null {
        return this.#ref;
    }

    getDatatype(): any {
        return this.#datatype;
    }

    getDimensions(): number[] {
        return this.#dims;
    }

    getAlternateName(): string {
        return this.#alternateName;
    }

    getSizeInBytes(): number {
        return this.#sizeInBytes;
    }

    setAlternateName(name: string) {
        this.#alternateName = name;
    }

    setWritten(): void {
        this.#isInit = true;
        this.#isWritten = true;
    }

    setRead(): void {
        this.#isInit = true;
        this.#isRead = true;
    }

    setInitialized(): void {
        this.#isInit = true;
    }

    isWritten(): boolean {
        return this.#isWritten;
    }

    isRead(): boolean {
        return this.#isRead;
    }

    isInitialized(): boolean {
        return this.#isInit;
    }

    isOnlyRead(): boolean {
        return this.#isRead && !this.#isWritten;
    }

    isOnlyWritten(): boolean {
        return !this.#isRead && this.#isWritten;
    }

    getDatatypeSize(): number {
        return this.#datatypeSize;
    }

    getImmediateFunctionCall(): Call | null {
        return this.#immediateFunctionCall;
    }

    setImmediateFunctionCall(call: Call): void {
        if (this.#itemOrigin !== DataItemOrigin.CONSTANT) {
            throw new Error("You can only specify an immediate function call for immediate constants!");
        }
        this.#immediateFunctionCall = call;
    }

    isNewlyCreated(): boolean {
        return this.#itemOrigin === DataItemOrigin.NEW;
    }

    isFromParam(): boolean {
        return this.#itemOrigin === DataItemOrigin.PARAM;
    }

    isFromGlobal(): boolean {
        return this.#itemOrigin === DataItemOrigin.GLOBAL_REF;
    }

    isConstant(): boolean {
        return this.#itemOrigin === DataItemOrigin.CONSTANT;
    }

    isScalar(): boolean {
        return this.#isScalar;
    }

    toString(): string {
        const status = !this.#isInit ? "U" : (this.#isRead ? "R" : "") + (this.#isWritten ? "W" : "");
        const refName = this.#ref ? this.#ref.name : "<null_ref>";
        return `${refName} {${this.#sizeInBytes}} ${status}`;
    }

    #demangleDatatype(decl: Vardecl): void {
        const type = decl.type;
        const typeCode = type.code;

        if (type.isArray) {
            this.#demangleArray(typeCode);
        }
        else if (type.isPointer) {
            this.#demanglePointer(typeCode);
        }
        else {
            this.#demangleScalar(typeCode);
        }
    }

    #getNameFromRef(ref: Vardecl): string {
        if (ref instanceof IntLiteral || ref instanceof FloatLiteral) {
            return "imm(" + ref.value + ")";
        }
        else {
            return ref.name;
        }
    }

    #demangleScalar(typeCode: string): void {
        this.#datatype = typeCode;
        this.#datatypeSize = ClavaUtils.getDatatypeSize(typeCode);
        this.#sizeInBytes = this.#datatypeSize;
        this.#isScalar = true;
    }

    #demanglePointer(typeCode: string): void {
        const datatype = typeCode.substring(0, typeCode.indexOf("*"));
        const datatypeSize = ClavaUtils.getDatatypeSize(datatype);

        const match = typeCode.match(/\*/g);
        const refCount = match ? match.length : 0;
        const dims = Array.from({ length: refCount }, () => -1);

        this.#dims = dims;
        this.#datatype = datatype;
        this.#datatypeSize = datatypeSize;
        this.#isScalar = false;
    }

    #demangleArray(typeCode: string): void {
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
            this.#dims = dims;
            this.#sizeInBytes = size;
        }

        this.#datatype = datatype;
        this.#datatypeSize = datatypeSize;
        this.#isScalar = false;
    }
}