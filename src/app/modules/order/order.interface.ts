import { Types } from "mongoose";

export enum OrderType {
  POS = "POS",
  ONLINE = "ONLINE",
}

export enum OrderStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CONFIRMED = "CONFIRMED",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export enum DeliveryStatus {
  NOT_SHIPPED = "NOT_SHIPPED",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  RETURNED = "RETURNED",
}

export interface IOrderProduct {
  product: Types.ObjectId;
  quantity: number;
  title?: string;
  price: number;
  lineTotal: number;
}

export interface IBillingDetails {
  fullName: string;
  phone: string;
  email: string;
  address: string;
}

export interface IOrder {
  _id?: Types.ObjectId;
  customOrderId?: number;

  orderType: OrderType;

  customer?: Types.ObjectId;

  billingDetails?: IBillingDetails;

  products: IOrderProduct[];

  subtotal: number;
  discount: number
  shippingCost: number;
  note: string;
  total: number;

  transactionId?: string;
  payment?: string;

  courierName?: string;
  trackingNumber?: string;

  orderStatus: OrderStatus;
  deliveryStatus: DeliveryStatus;
  isDeleted?: boolean;
  seller?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}
