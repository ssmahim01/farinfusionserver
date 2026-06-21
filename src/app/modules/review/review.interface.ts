import { Types } from "mongoose";

export enum ReviewStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum ReviewSource {
  FACEBOOK = "FACEBOOK",
  WEBSITE = "WEBSITE",
}

export interface IReview {
  _id?: Types.ObjectId;

  product: Types.ObjectId;

  order?: Types.ObjectId;

  customerName: string;

  rating: number;

  reviewText: string;

  reviewImage?: string;

  reviewSource: ReviewSource;

  status: ReviewStatus;

  createdBy?: Types.ObjectId;

  isDeleted?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}