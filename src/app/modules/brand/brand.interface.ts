
import { Types } from "mongoose";

export enum BrandStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
}

export interface IBrand {
    _id?: Types.ObjectId;
    title: string;
    slug: string;
    description: string;
    image: string;
    productCount: number;
    status: BrandStatus;
    isDeleted?: boolean;
}