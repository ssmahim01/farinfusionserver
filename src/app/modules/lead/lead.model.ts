import { Schema, model } from "mongoose";
import { ILead, LeadStatus, LeadPriority, SocialStatus } from "./lead.interface";

const LeadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
    },
    hasOrderedToday: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
      unique: true,
      index: true,
    },
    fraudProfile: {
      totalOrders: { type: Number, default: 0 },
      deliveredOrders: { type: Number, default: 0 },
      cancelledOrders: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 },
      cancelRate: { type: Number, default: 0 },
      risk: {
        type: String,
        enum: ["SAFE", "MEDIUM", "HIGH", "FAKE"],
        default: "SAFE",
      },
      isFakeCustomer: { type: Boolean, default: false },
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    social: {
      type: String,
      enum: Object.values(SocialStatus),
      required: false,
    },
  
    status: {
      type: String,
      enum: Object.values(LeadStatus),
      default: LeadStatus.NEW,
      index: true,
    },
    isDeleted: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: Object.values(LeadPriority),
      default: LeadPriority.MEDIUM,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Lead = model<ILead>("Lead", LeadSchema);
