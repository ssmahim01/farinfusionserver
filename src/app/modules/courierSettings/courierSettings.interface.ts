import { Types } from "mongoose";

export enum CourierProvider {
  STEADFAST = "STEADFAST",
  PAPERFLY = "PAPERFLY",
  PATHAO = "PATHAO",
  REDX = "REDX",
  ECOURIER = "ECOURIER",
  SUNDARBAN = "SUNDARBAN",
  CUSTOM = "CUSTOM",
}

export interface ICourierSettings {
  provider: CourierProvider;

  displayName: string;

  config: Record<string, string>;

  pickupInfo?: {
    name?: string;
    phone?: string;
    address?: string;
    area?: string;
    city?: string;
  };

  webhookUrl?: string;

  notes?: string;

  isActive: boolean;

  isSandbox: boolean;

  createdBy?: Types.ObjectId;

  updatedBy?: Types.ObjectId;

  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}