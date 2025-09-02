/* eslint-disable @typescript-eslint/no-explicit-any */
import { Call, FloatLiteral, IntLiteral, Loop, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import { TaskType } from "./TaskType.js";
import { DataItem } from "../dataitems/DataItem.js";
import { Communication } from "../Communication.js";
import { ControlEdge } from "../ControlEdge.js";
import { DataItemOrigin } from "../DataItemOrigin.js";
import { AccessType } from "../AccessType.js";
import { VariableDataItem } from "../dataitems/VariableDataItem.js";
import { ConstantDataItem } from "../dataitems/ConstantDataItem.js";

export abstract class Task {
    // Basic task details
    private id: string = "TNull";
    private name: string = "<anonymous>"
    private type: TaskType = TaskType.REGULAR;
    private loopReference: Loop | null = null;

    // Data properties
    private dataParams: VariableDataItem[] = [];
    private dataGlobalRefs: VariableDataItem[] = [];
    private dataNew: VariableDataItem[] = [];
    private dataConstants: ConstantDataItem[] = [];

    // Data communication properties
    private incomingComm: Communication[] = [];
    private outgoingComm: Communication[] = [];

    // Control properties
    private incomingControl: ControlEdge[] = [];
    private outgoingControl: ControlEdge[] = [];

    // Annotations
    private annotations: Record<string, any> = {};

    constructor(type: TaskType) {
        this.type = type;
    }

    public getType(): TaskType {
        return this.type;
    }

    public getId(): string {
        return this.id;
    }

    public setId(id: string): void {
        this.id = id;
    }

    public getName(): string {
        return this.name;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public getUniqueName(): string {
        return `${this.id}-${this.name}`;
    }

    public getLoopReference(): Loop | null {
        return this.loopReference;
    }

    // Data methods
    public getDataRead(type = DataItemOrigin.ANY): DataItem[] {
        return this.getDataByAccessType(AccessType.READ, type);
    }

    public getDataWritten(type = DataItemOrigin.ANY): DataItem[] {
        return this.getDataByAccessType(AccessType.WRITE, type);
    }

    public getData(): DataItem[] {
        return [...this.dataParams, ...this.dataGlobalRefs, ...this.dataNew, ...this.dataConstants];
    }

    public getDataAsMap(): Map<string, DataItem> {
        const data = new Map();
        for (const datum of this.getData()) {
            data.set(datum.getName(), datum);
        }
        return data;
    }

    public getDataItemByName(name: string): DataItem | null {
        return this.getData().find((datum) => datum.getName() == name) || null;
    }

    public getDataItemByPrevTaskName(name: string): DataItem | null {
        return this.getData().find((datum) => datum.getNameInPreviousTask() == name) || null;
    }

    public getParamData(): VariableDataItem[] {
        return this.dataParams;
    }

    public addParamData(dataItem: VariableDataItem): void {
        this.dataParams.push(dataItem);
    }

    public getGlobalRefData(): VariableDataItem[] {
        return this.dataGlobalRefs;
    }

    public addGlobalRefData(dataItem: VariableDataItem): void {
        this.dataGlobalRefs.push(dataItem);
    }

    public getNewData(): VariableDataItem[] {
        return this.dataNew;
    }

    public addNewData(dataItem: VariableDataItem): void {
        if (dataItem.getItemOriginType() != DataItemOrigin.NEW) {
            throw new Error("Data item must be of origin NEW");
        }
        this.dataNew.push(dataItem);
    }

    public getConstantData(): ConstantDataItem[] {
        return this.dataConstants;
    }

    public addConstantData(dataItem: ConstantDataItem): void {
        this.dataConstants.push(dataItem);
    }

    public getReferencedData(): VariableDataItem[] {
        return [...this.dataParams, ...this.dataGlobalRefs];
    }

    // Communication methods
    public addOutgoingComm(...communication: Communication[]): void {
        this.outgoingComm.push(...communication);
    }

    public addIncomingComm(...communication: Communication[]): void {
        this.incomingComm.push(...communication);
    }

    public getOutgoingComm(): Communication[] {
        return this.outgoingComm;
    }

    public getIncomingComm(): Communication[] {
        return this.incomingComm;
    }

    public removeOutgoingComm(...toRemove: Communication[]): void {
        this.outgoingComm = this.outgoingComm.filter((comm) => !toRemove.includes(comm));
    }

    public removeIncomingComm(...toRemove: Communication[]): void {
        this.incomingComm = this.incomingComm.filter((comm) => !toRemove.includes(comm));
    }

    public removeAllOutgoingComm(): void {
        this.outgoingComm = [];
    }

    public removeAllIncomingComm(): void {
        this.incomingComm = [];
    }

    public getOutgoingOfData(datum: DataItem): Communication[] {
        const comm = [];
        for (const communication of this.outgoingComm) {
            if (communication.getSourceData().getNameInTask() == datum.getNameInTask() ||
                communication.getSourceData().getNameInPreviousTask() == datum.getNameInTask()) {
                comm.push(communication);
            }
        }
        return comm;
    }

    public getIncomingOfData(datum: DataItem): Communication | null {
        for (const communication of this.incomingComm) {
            if (communication.getTargetData().getNameInTask() == datum.getNameInTask() ||
                communication.getTargetData().getNameInPreviousTask() == datum.getNameInTask()) {
                return communication;
            }
        }
        return null;
    }

    // Control methods
    public getOutgoingControl(): ControlEdge[] {
        return this.outgoingControl;
    }

    public getIncomingControl(): ControlEdge[] {
        return this.incomingControl;
    }

    public addOutgoingControl(control: ControlEdge): void {
        this.outgoingControl.push(control);
    }

    public addIncomingControl(control: ControlEdge): void {
        this.incomingControl.push(control);
    }

    public createDataObjects(vars: Vardecl[], originType: DataItemOrigin): void {
        for (const vardecl of vars) {
            const data = new VariableDataItem(vardecl, originType);

            switch (originType) {
                case DataItemOrigin.PARAM:
                    this.dataParams.push(data);
                    break;
                case DataItemOrigin.GLOBAL_REF:
                    this.dataGlobalRefs.push(data);
                    break;
                case DataItemOrigin.NEW:
                    this.dataNew.push(data);
                    break;
                default:
                    break;
            }
        }
    }

    public createConstantObject(immConst: Literal, funCall: Call): void {
        const datum = new ConstantDataItem(immConst);
        datum.setImmediateFunctionCall(funCall);
        this.dataConstants.push(datum);
    }

    // Annotations
    public getAnnotation(key: string): any {
        return this.annotations[key];
    }

    public setAnnotation(key: string, value: any): void {
        this.annotations[key] = value;
    }

    public getAnnotations(): Record<string, any> {
        return this.annotations;
    }

    public setAnnotations(annotations: Record<string, any>): void {
        this.annotations = annotations;
    }

    // ---------------------------------------------------------------------
    private getDataByAccessType(accessType: AccessType, origin = DataItemOrigin.ANY): DataItem[] {
        let data: DataItem[] = [];
        if (origin == DataItemOrigin.ANY) {
            data = [
                ...this.dataParams,
                ...this.dataGlobalRefs,
                ...this.dataNew,
                ...this.dataConstants];
        }
        if (origin == DataItemOrigin.PARAM) {
            data = this.dataParams;
        }
        if (origin == DataItemOrigin.GLOBAL_REF) {
            data = this.dataGlobalRefs;
        }
        if (origin == DataItemOrigin.NEW) {
            data = this.dataNew;
        }
        if (origin == DataItemOrigin.CONSTANT) {
            data = this.dataConstants;
        }

        const dataAccessed = [];
        for (const datum of data) {
            if (accessType === AccessType.READ) {
                if (datum.isWritten()) {
                    dataAccessed.push(datum);
                }
            }
            else if (accessType === AccessType.WRITE) {
                if (datum.isWritten()) {
                    dataAccessed.push(datum);
                }
            }
        }
        return dataAccessed;
    }
}