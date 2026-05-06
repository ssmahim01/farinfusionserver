import { Types } from "mongoose";

export enum OrderType {
  POS = "POS",
  ONLINE = "ONLINE",
}

export enum OrderStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CONFIRMED = "CONFIRMED",
  PARTIAL = "PARTIAL",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  DAMAGE = "DAMAGE",
}

export enum DeliveryStatus {
  NOT_SHIPPED = "NOT_SHIPPED",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  RETURNED = "RETURNED",
  CANCELLED = "CANCELLED",
}

export interface IOrderProduct {
  product: Types.ObjectId;
  quantity: number;
  title?: string;
  price: number;
  lineTotal?: number;
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
  scheduleType?: string;
  scheduledAt?: Date;
  isPublished?: boolean;

  orderType: OrderType;
  exchangeHistory?: any[];
  damageProducts?: any[];

  customer?: Types.ObjectId;
  partialNotes?: string;

  billingDetails?: IBillingDetails;

  products: IOrderProduct[];

  subtotal: number;
  discount: number;
  shippingCost: number;
  note: string;
  total: number;

  transactionId?: string;
  payment?: string;
  isRestocked?: boolean;

  courierName?: string;
  trackingNumber?: string;

  orderStatus: OrderStatus;
  deliveryStatus: DeliveryStatus;
  isDeleted?: boolean;
  seller?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}
