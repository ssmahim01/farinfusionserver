import { Schema, model } from "mongoose";
import {
  CourierProvider,
  ICourierSettings,
} from "./courierSettings.interface";

const courierSettingsSchema = new Schema<ICourierSettings>(
  {
    provider: {
      type: String,
      enum: Object.values(CourierProvider),
      required: true,
      unique: true,
      trim: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    config: {
      type: Map,
      of: String,
      required: true,
      default: {},
    },

    pickupInfo: {
      name: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      area: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
    },

    webhookUrl: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isSandbox: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
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

courierSettingsSchema.index({ provider: 1 });

export const CourierSettings = model<ICourierSettings>(
  "CourierSettings",
  courierSettingsSchema,
);