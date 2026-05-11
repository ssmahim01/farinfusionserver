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

export interface IPurchaseProduct {
  product: Types.ObjectId;
  quantity: number;
  buyingPrice: number;
  totalAmount: number;
}

export interface IProductPurchase {
  products: IPurchaseProduct[];

  supplierName: string;
  supplierPhone?: string;
  supplierAddress?: string;

  grandTotal?: number;

  purchaseDate: Date;

  paymentStatus: PaymentStatus;
  purchaseStatus: PurchaseStatus;

  invoiceNo?: string;
  reference?: string;
  notes?: string;

  createdBy: Types.ObjectId;

  isDeleted: boolean;
}