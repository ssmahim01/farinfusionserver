
import { Types } from "mongoose";

export enum LeadStatus {
    NEW = "NEW",
    CONTACTED = "CONTACTED",
    QUALIFIED = "QUALIFIED",
    WON = "WON",
    LOST = "LOST",
    INACTIVE = "INACTIVE",
}

export enum LeadPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
}

export interface ILead {
    _id?: Types.ObjectId;
    name: string;
    email?: string;
    phone: string;
    address: string;
    status: LeadStatus;
    isDeleted?: boolean;
    hasOrderedToday?: boolean;
    priority?: LeadPriority;
    assignedBy?: Types.ObjectId;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}