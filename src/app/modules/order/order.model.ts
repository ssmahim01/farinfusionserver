import { Schema, model } from "mongoose";
import { DeliveryStatus, IOrder, OrderStatus } from "./order.interface";

// customer order Id counter
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1000 },
});

export const Counter = model("Counter", counterSchema);

// Order Schema
const orderSchema = new Schema<IOrder>(
  {
    customOrderId: {
      type: String,
      required: true,
      unique: true,
    },

    orderType: {
      type: String,
      enum: ["POS", "ONLINE"],
      required: true,
    },

    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    billingDetails: {
      fullName: String,
      phone: String,
      email: String,
      address: String,
    },

    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        title: String,
        quantity: Number,
        price: Number,
      },
    ],

    subtotal: Number,
    shippingCost: Number,
    total: Number,
    discount: Number,
    note: String,

    transactionId: String,
    payment: String,
    isDeleted: { type: Boolean, default: false },
    courierName: String,
    trackingNumber: String,

    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },

    deliveryStatus: {
      type: String,
      enum: Object.values(DeliveryStatus),
      default: DeliveryStatus.NOT_SHIPPED,
    },

    scheduleType: {
      type: String,
      enum: ["INSTANT", "SCHEDULED"],
      default: "INSTANT",
    },

    scheduledAt: {
      type: Date,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

export const Order = model<IOrder>("Order", orderSchema);
