import { Call, Type } from "@specs-feup/clava/api/Joinpoints.js";
import { DataItemOrigin } from "../DataItemOrigin.js";
import { ClavaUtils } from "../../util/ClavaUtils.js";

export abstract class DataItem {
    protected nameInTask: string = "<no_name_in_task>";
    protected nameInInterface: string = "<n/a>";
    protected nameInPrevTask: string = "<no_name_in_prev_task>";

    protected isInit: boolean = false;
    protected dataIsWritten: boolean = false;
    protected dataIsRead: boolean = false;

    protected dataIsScalar: boolean = false;
    protected dims: number[] = [];
    protected sizeInBytes: number = -1;
    protected datatype: string = "<no_type>";
    protected datatypeSize: number = 4;

    protected itemOrigin: DataItemOrigin = DataItemOrigin.NEW;

    protected immediateFunctionCall: Call | null = null;

    constructor(nameInTask: string, type: Type, origin: DataItemOrigin) {
        this.nameInTask = nameInTask;
        this.demangleDatatype(type);
        this.itemOrigin = origin;
    }

    public getName(): string {
        return this.getNameInTask();
    }

    public getNameInTask(): string {
        return this.nameInTask;
    }

    public getNameInInterface(): string {
        return this.nameInInterface;
    }

    public getNameInPreviousTask(): string {
        return this.nameInPrevTask;
    }

    public getItemOriginType(): DataItemOrigin {
        return this.itemOrigin;
    }

    public getDatatype(): string {
        return this.datatype;
    }

    public getDimensions(): number[] {
        return this.dims;
    }

    public getSizeInBytes(): number {
        return this.sizeInBytes;
    }

    public setNameInInterface(name: string): void {
        this.nameInInterface = name;
    }

    public setNameInPreviousTask(name: string): void {
        this.nameInPrevTask = name;
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
        const refName = this.nameInTask;
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