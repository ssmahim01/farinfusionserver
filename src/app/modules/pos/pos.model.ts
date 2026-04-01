import { Schema, model } from "mongoose";
import { IPOSOrder } from "./pos.interface";

const posOrderSchema = new Schema<IPOSOrder>(
  {
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],

    customer: {
      name: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      zipCode: String,
      notes: String,
    },

    orderType: {
      type: String,
      enum: ["PICKUP", "DELIVERY"],
      required: true,
    },

    subtotal: Number,
    tax: Number,
    deliveryFee: Number,
    total: Number,

    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
      default: "CONFIRMED",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export const POSOrder = model<IPOSOrder>("POSOrder", posOrderSchema);
