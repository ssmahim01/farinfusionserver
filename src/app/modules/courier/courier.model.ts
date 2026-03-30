import { Schema, model } from "mongoose";
import {
  ICourier,
  CourierName,
  CourierStatus,
  CourierDeliveryStatus,
} from "./courier.interface";

const courierSchema = new Schema<ICourier>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    courierName: {
      type: String,
      enum: Object.values(CourierName),
      required: true,
    },

    consignmentId: {
      type: Number,
    },

    trackingCode: {
      type: String,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(CourierStatus),
      default: CourierStatus.PENDING,
    },

    deliveryStatus: {
      type: String,
      enum: Object.values(CourierDeliveryStatus),
      default: CourierDeliveryStatus.PENDING,
    },

    rawResponse: {
      type: Schema.Types.Mixed,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

courierSchema.index({ order: 1 });
courierSchema.index({ trackingCode: 1 });

export const Courier = model<ICourier>("Courier", courierSchema);