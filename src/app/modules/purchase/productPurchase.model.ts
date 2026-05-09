import { Schema, model } from "mongoose";
import {
  IProductPurchase,
  PaymentStatus,
  PurchaseStatus,
} from "./productPurchase.interface";

const productPurchaseSchema = new Schema<IProductPurchase>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    supplierPhone: {
      type: String,
      trim: true,
    },

    supplierAddress: {
      type: String,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    buyingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: false,
      min: 0,
    },

    purchaseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.UNPAID,
    },

    purchaseStatus: {
      type: String,
      enum: Object.values(PurchaseStatus),
      default: PurchaseStatus.PENDING,
    },

    invoiceNo: {
      type: String,
      trim: true,
    },

    reference: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

export const ProductPurchase = model<IProductPurchase>(
  "ProductPurchase",
  productPurchaseSchema,
);