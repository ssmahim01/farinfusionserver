import { Schema, model } from "mongoose";
import { IPermission } from "./permission.interface";

const permissionSchema = new Schema<IPermission>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    group: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Permission = model<IPermission>(
  "Permission",
  permissionSchema
);