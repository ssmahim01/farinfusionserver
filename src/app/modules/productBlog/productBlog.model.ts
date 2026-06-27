import { Schema, model } from "mongoose";
import {
  ProductBlogCategory,
  ProductBlogContentType,
  ProductBlogStatus,
} from "./productBlog.constants";
import { IProductBlog } from "./productBlog.interface";

const productBlogSchema = new Schema<IProductBlog>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    thumbnail: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: Object.values(ProductBlogCategory),
      default: ProductBlogCategory.BEAUTY,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    contentType: {
      type: String,
      enum: Object.values(ProductBlogContentType),
      default: ProductBlogContentType.ARTICLE,
    },

    videoUrl: {
      type: String,
      default: null,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    readingTime: {
      type: Number,
      default: 1,
    },

    views: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: Object.values(ProductBlogStatus),
      default: ProductBlogStatus.PUBLISHED,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const ProductBlog = model<IProductBlog>(
  "ProductBlog",
  productBlogSchema,
);