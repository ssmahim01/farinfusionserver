import { z } from "zod";

export const createPOSOrderZodSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        product: z.object({
          _id: z.string(),
        }),
        quantity: z.number().min(1),
      })
    ),

    subtotal: z.number(),
    tax: z.number(),
    deliveryFee: z.number(),
    total: z.number(),

    orderType: z.enum(["PICKUP", "DELIVERY"]),

    customerName: z.string(),
    customerEmail: z.string().email(),
    customerPhone: z.string(),

    customerAddress: z.string().optional(),
    customerCity: z.string().optional(),
    customerZipCode: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updatePOSOrderStatusZodSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]),
  }),
});