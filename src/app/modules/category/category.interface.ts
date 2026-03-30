
import { Types } from "mongoose";

export enum CategoryStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
}

export interface ICategory {
    _id?: Types.ObjectId;
    title: string;
    slug: string;
    description: string;
    image: string;
    status: CategoryStatus;
    showOrder: number;
    isDeleted?: boolean;
}