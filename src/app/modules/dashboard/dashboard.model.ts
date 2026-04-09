import { Schema, model } from "mongoose";

const dashboardCacheSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: Object, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const DashboardCache = model("DashboardCache", dashboardCacheSchema);