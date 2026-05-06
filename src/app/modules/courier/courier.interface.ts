/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";

export enum CourierName {
  STEADFAST = "STEADFAST",
  PATHAO = "PATHAO",
  REDX = "REDX",
}

export enum CourierStatus {
  PENDING = "PENDING",
  CREATED = "CREATED",
  DELIVERED = "DELIVERED",
  IN_TRANSIT = "IN_TRANSIT",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}

export enum CourierDeliveryStatus {
  PENDING = "PENDING",
  IN_TRANSIT = "IN_TRANSIT",
  PARTIAL = "PARTIAL",
  PICKED_UP = "PICKED_UP",
  IN_REVIEW = "IN_REVIEW",
  DELIVERED = "DELIVERED",
  PARTIAL_DELIVERED = "PARTIAL_DELIVERED",
  CANCELLED = "CANCELLED",
  HOLD = "HOLD",
}

export interface ICourier {
  _id?: Types.ObjectId;

  order: Types.ObjectId;

  courierName: CourierName;

  consignmentId?: number;
  trackingCode?: string;

  status: CourierStatus;
  deliveryStatus: CourierDeliveryStatus;

  rawResponse?: Record<string, any>;

  isDeleted?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
