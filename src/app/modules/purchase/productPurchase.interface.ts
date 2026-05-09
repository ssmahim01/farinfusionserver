import { Types } from "mongoose";

export enum PurchaseStatus {
  PENDING = "PENDING",
  ORDERED = "ORDERED",
  RECEIVED = "RECEIVED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  UNPAID = "UNPAID",
  PARTIAL = "PARTIAL",
  PAID = "PAID",
}

export interface IProductPurchase {
  product: Types.ObjectId;

  supplierName: string;
  supplierPhone?: string;
  supplierAddress?: string;

  quantity: number;
  buyingPrice: number;
  totalAmount?: number;

  purchaseDate: Date;

  paymentStatus: PaymentStatus;
  purchaseStatus: PurchaseStatus;

  invoiceNo?: string;
  reference?: string;
  notes?: string;

  createdBy: Types.ObjectId;

  isDeleted: boolean;
}