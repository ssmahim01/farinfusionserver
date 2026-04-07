import { Types } from "mongoose";

export enum Role {
    ADMIN = "ADMIN",
    MANAGER = "MANAGER",
    MODERATOR = "MODERATOR",
    TELLICELSS = "TELLICELSS",
    CUSTOMER = "CUSTOMER"
}


export enum IsActive {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    BLOCKED = "BLOCKED"
}

export interface IUser {
    _id?: Types.ObjectId;
    name: string;
    email: string;
    password?: string;
    phone?: string;
    address: string;
    picture?: string;
    isActive?: IsActive;
    isVerified?: boolean;
    isDeleted?: boolean;
    salary?: number;
    commissionSalary?: number;
    role: Role;
}