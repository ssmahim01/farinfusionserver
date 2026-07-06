import { Schema, model } from "mongoose";
import {
  VerificationCategory,
  VerificationContentType,
  VerificationStatus,
} from "./productVerification.constants";
import {
  IProductVerification,
  ProductVerificationModel,
} from "./productVerification.interface";

const ProductVerificationSchema = new Schema<IProductVerification>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: false,
      unique: true,
      lowercase: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    thumbnail: {
      type: String,
      default: "",
    },

    mediaUrl: {
      type: String,
      required: true,
    },

    mediaType: {
      type: String,
      enum: Object.values(VerificationContentType),
      default: VerificationContentType.VIDEO,
    },

    category: {
      type: String,
      enum: Object.values(VerificationCategory),
      default: VerificationCategory.OTHERS,
    },

    tags: {
      type: [String],
      default: [],
    },

    featured: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PUBLISHED,
    },

    views: {
      type: Number,
      default: 0,
    },

    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
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
  },
);

export const ProductVerification = model<
  IProductVerification,
  ProductVerificationModel
>("ProductVerification", ProductVerificationSchema);
