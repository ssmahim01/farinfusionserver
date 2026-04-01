import { Types } from "mongoose";

export type POSOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export interface IPOSProduct {
  product: Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IPOSCustomer {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  zipCode?: string;
  notes?: string;
}

export interface IPOSOrder {
  products: IPOSProduct[];
  customer: IPOSCustomer;

  orderType: "PICKUP" | "DELIVERY";

  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;

  status: POSOrderStatus;

  createdBy: Types.ObjectId;
}