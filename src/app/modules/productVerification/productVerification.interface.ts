import { Model, Types } from "mongoose";

export type TVerificationContentType =
  | "VIDEO"
  | "PDF"
  | "ARTICLE"
  | "EXTERNAL_LINK";

export type TVerificationStatus =
  | "PUBLISHED"
  | "DRAFT";

export type TVerificationCategory =
  | "COSMETICS"
  | "SKIN_CARE"
  | "HEALTH"
  | "PERFUME"
  | "ELECTRONICS"
  | "OTHERS";

export interface IProductVerification {
  title: string;

  slug?: string;

  shortDescription: string;

  description?: string;

  thumbnail?: string;

  mediaUrl: string;

  mediaType: TVerificationContentType;

  category: TVerificationCategory;

  tags: string[];

  featured: boolean;

  status: TVerificationStatus;

  views: number;

  createdBy?: Types.ObjectId;

  isDeleted: boolean;
}

export interface ProductVerificationModel
  extends Model<IProductVerification> {}