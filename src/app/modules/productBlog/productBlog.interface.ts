import { Types } from "mongoose";

export type TProductBlogStatus =
  | "DRAFT"
  | "PUBLISHED";

export type TProductBlogCategory =
  | "SKINCARE"
  | "HAIRCARE"
  | "BABY_CARE"
  | "BEAUTY"
  | "COSMETICS"
  | "HEALTH"
  | "LIFESTYLE"
  | "TUTORIAL";

export type TProductBlogContentType =
  | "ARTICLE"
  | "VIDEO";

export interface IProductBlog {
  title: string;
  slug: string;

  shortDescription: string;
  content: string;

  thumbnail: string;

  category: TProductBlogCategory;

  tags: string[];

  contentType: TProductBlogContentType;

  videoUrl?: string;

  featured: boolean;

  views: number;

  readingTime: number;

  status: TProductBlogStatus;

  createdBy?: Types.ObjectId;

  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}