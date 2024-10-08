import { Call, Literal, Loop, Param, Vardecl, Varref } from "@specs-feup/clava/api/Joinpoints.js";
import { TaskType } from "./TaskType.js";
import { DataItem } from "../DataItem.js";
import { Communication } from "../Communication.js";
import { ControlEdge } from "../ControlEdge.js";
import { DataItemOrigin } from "../DataItemOrigin.js";
import { AccessType } from "../AccessType.js";

export abstract class Task {
    // Basic task details
    #id: string = "TNull";
    #name: string = "<anonymous>"
    #type: TaskType = TaskType.REGULAR;
    #repetitions: number = 1;
    #loopReference: Loop | null = null;

    // Data properties
    #dataParams: DataItem[] = [];
    #dataGlobalRefs: DataItem[] = [];
    #dataNew: DataItem[] = [];
    #dataConstants: DataItem[] = [];

    // Data communication properties
    #incomingComm: Communication[] = [];
    #outgoingComm: Communication[] = [];

    // Control properties
    #incomingControl: ControlEdge[] = [];
    #outgoingControl: ControlEdge[] = [];

    // Annotations
    #annotations: Record<string, any> = {};

    constructor(type: TaskType) {
        this.#type = type;
    }

    getType(): TaskType {
        return this.#type;
    }

    getId(): string {
        return this.#id;
    }

    setId(id: string): void {
        this.#id = id;
    }

    getName(): string {
        return this.#name;
    }

    setName(name: string): void {
        this.#name = name;
    }

    getUniqueName(): string {
        return `${this.#id}-${this.#name}`;
    }

    setRepetitions(repetitions: number, loopRef: Loop) {
        this.#repetitions = repetitions;
        this.#loopReference = loopRef;
    }

    getRepetitions(): number {
        return this.#repetitions;
    }

    getLoopReference(): Loop | null {
        return this.#loopReference;
    }

    // Data methods
    getDataRead(type = DataItemOrigin.ANY): DataItem[] {
        return this.#getDataByAccessType(AccessType.READ, type);
    }

    getDataWritten(type = DataItemOrigin.ANY): DataItem[] {
        return this.#getDataByAccessType(AccessType.WRITE, type);
    }

    getData(): DataItem[] {
        return [...this.#dataParams, ...this.#dataGlobalRefs, ...this.#dataNew, ...this.#dataConstants];
    }

    getDataAsMap(): Map<string, DataItem> {
        const data = new Map();
        for (const datum of this.getData()) {
            data.set(datum.getName(), datum);
        }
        return data;
    }

    getDataItemByName(name: string): DataItem | null {
        for (const datum of this.getData()) {
            if (datum.getName() == name) {
                return datum;
            }
        }
        return null;
    }

    getDataItemByAltName(name: string): DataItem | null {
        for (const datum of this.getData()) {
            if (datum.getAlternateName() == name) {
                return datum;
            }
        }
        return null;
    }

    getParamData(): DataItem[] {
        return this.#dataParams;
    }

    addParamData(dataItem: DataItem): void {
        this.#dataParams.push(dataItem);
    }

    getGlobalRefData(): DataItem[] {
        return this.#dataGlobalRefs;
    }

    addGlobalRefData(dataItem: DataItem): void {
        this.#dataGlobalRefs.push(dataItem);
    }

    getNewData(): DataItem[] {
        return this.#dataNew;
    }

    addNewData(dataItem: DataItem): void {
        this.#dataNew.push(dataItem);
    }

    getConstantData(): DataItem[] {
        return this.#dataConstants;
    }

    addConstantData(dataItem: DataItem): void {
        this.#dataConstants.push(dataItem);
    }

    getReferencedData(): DataItem[] {
        return [...this.#dataParams, ...this.#dataGlobalRefs];
    }

    // Communication methods
    addOutgoingComm(communication: Communication): void {
        this.#outgoingComm.push(communication);
    }

    addIncomingComm(communication: Communication): void {
        this.#incomingComm.push(communication);
    }

    getOutgoingComm(): Communication[] {
        return this.#outgoingComm;
    }

    getIncomingComm(): Communication[] {
        return this.#incomingComm;
    }

    getOutgoingOfData(datum: DataItem): Communication[] {
        const comm = [];
        for (const communication of this.#outgoingComm) {
            if (communication.getSourceData().getName() == datum.getName() ||
                communication.getSourceData().getAlternateName() == datum.getName()) {
                comm.push(communication);
            }
        }
        return comm;
    }

    getIncomingOfData(datum: DataItem): Communication | null {
        for (const communication of this.#incomingComm) {
            if (communication.getTargetData().getName() == datum.getName() ||
                communication.getTargetData().getAlternateName() == datum.getName()) {
                return communication;
            }
        }
        return null;
    }

    // Control methods
    getOutgoingControl(): ControlEdge[] {
        return this.#outgoingControl;
    }

    getIncomingControl(): ControlEdge[] {
        return this.#incomingControl;
    }

    addOutgoingControl(control: ControlEdge): void {
        this.#outgoingControl.push(control);
    }

    addIncomingControl(control: ControlEdge): void {
        this.#incomingControl.push(control);
    }

    createDataObjects(vars: Vardecl[], originType: DataItemOrigin): void {
        for (const vardecl of vars) {
            const data = new DataItem(vardecl, originType);

            switch (originType) {
                case DataItemOrigin.PARAM:
                    this.#dataParams.push(data);
                    break;
                case DataItemOrigin.GLOBAL_REF:
                    this.#dataGlobalRefs.push(data);
                    break;
                case DataItemOrigin.NEW:
                    this.#dataNew.push(data);
                    break;
                default:
                    break;
            }
        }
    }

    createConstantObject(immConst: Literal, funCall: Call): void {
        const datum = new DataItem(immConst.vardecl, DataItemOrigin.CONSTANT);
        datum.setImmediateFunctionCall(funCall);
        this.#dataConstants.push(datum);
    }

    // Annotations
    getAnnotation(key: string): any {
        return this.#annotations[key];
    }

    setAnnotation(key: string, value: any): void {
        this.#annotations[key] = value;
    }

    getAnnotations(): Record<string, any> {
        return this.#annotations;
    }

    setAnnotations(annotations: Record<string, any>): void {
        this.#annotations = annotations;
    }

    // ---------------------------------------------------------------------
    #getDataByAccessType(accessType: AccessType, origin = DataItemOrigin.ANY): DataItem[] {
        let data: DataItem[] = [];
        if (origin == DataItemOrigin.ANY) {
            data = [
                ...this.#dataParams,
                ...this.#dataGlobalRefs,
                ...this.#dataNew,
                ...this.#dataConstants];
        }
        if (origin == DataItemOrigin.PARAM) {
            data = this.#dataParams;
        }
        if (origin == DataItemOrigin.GLOBAL_REF) {
            data = this.#dataGlobalRefs;
        }
        if (origin == DataItemOrigin.NEW) {
            data = this.#dataNew;
        }
        if (origin == DataItemOrigin.CONSTANT) {
            data = this.#dataConstants;
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