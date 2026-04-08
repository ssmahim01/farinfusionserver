import { Schema, model } from "mongoose";
import { ILead, LeadStatus, LeadPriority } from "./lead.interface";

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
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
      unique: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
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
