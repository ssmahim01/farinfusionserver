import z from "zod";
import { PaymentStatus, PurchaseStatus } from "./productPurchase.interface";

const createProductPurchaseValidationSchema = z.object({
  body: z.object({
    product: z.string(),

    supplierName: z.string(),

    supplierPhone: z.string().optional(),

    supplierAddress: z.string().optional(),

    quantity: z.number().min(1),

    buyingPrice: z.number().min(0),

    totalAmount: z.number().optional(),

    purchaseDate: z.string().optional(),

    paymentStatus: z.enum(Object.values(PaymentStatus) as [string]).optional(),

    purchaseStatus: z
      .enum(Object.values(PurchaseStatus) as [string])
      .optional(),

    invoiceNo: z.string().optional(),

    reference: z.string().optional(),

    notes: z.string().optional(),
  }),
});

const updateProductPurchaseValidationSchema = z.object({
  body: z.object({
    product: z.string().optional(),

    supplierName: z.string().optional(),

    supplierPhone: z.string().optional(),

    supplierAddress: z.string().optional(),

    quantity: z.number().min(1).optional(),

    buyingPrice: z.number().min(0).optional(),

    totalAmount: z.number().min(0).optional(),

    purchaseDate: z.string().optional(),

    paymentStatus: z.enum(Object.values(PaymentStatus) as [string]).optional(),

    purchaseStatus: z
      .enum(Object.values(PurchaseStatus) as [string])
      .optional(),

    invoiceNo: z.string().optional(),

    reference: z.string().optional(),

    notes: z.string().optional(),
  }),
});

export const ProductPurchaseValidation = {
  createProductPurchaseValidationSchema,
  updateProductPurchaseValidationSchema,
};
