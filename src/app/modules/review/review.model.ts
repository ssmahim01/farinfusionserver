import { Schema, model } from "mongoose";
import {
  IReview,
  ReviewSource,
  ReviewStatus,
} from "./review.interface";

const reviewSchema = new Schema<IReview>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    reviewText: {
      type: String,
      required: true,
      trim: true,
    },

    reviewImage: {
      type: String,
      default: null,
    },

    reviewSource: {
      type: String,
      enum: Object.values(ReviewSource),
      default: ReviewSource.FACEBOOK,
    },

    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.APPROVED,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

export const Review = model<IReview>(
  "Review",
  reviewSchema,
);