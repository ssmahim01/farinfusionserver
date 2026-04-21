import { z } from "zod";
import { DiscountType } from "./coupon.interface";

export const createCouponZodSchema = z.object({
 
    code: z.string().min(3),
    discountType: z.nativeEnum(DiscountType),
    discountValue: z.number().min(1),
    minOrderAmount: z.number().optional(),
    maxDiscount: z.number().optional(),
    expiryDate: z.string(),
    usageLimit: z.number().optional(),
});

export const applyCouponZodSchema = z.object({
    code: z.string(),
    total: z.number(),
});