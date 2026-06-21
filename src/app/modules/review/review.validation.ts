import { z } from "zod";
import { ReviewSource, ReviewStatus } from "./review.interface";

export const createReviewZodSchema = z.object({
  product: z
    .string({
      required_error: "Product is required",
    })
    .min(1),

  order: z.string().optional(),

  customerName: z
    .string({
      required_error: "Customer name is required",
    })
    .min(2, "Customer name must be at least 2 characters"),

  rating: z.coerce
    .number()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),

  reviewText: z
    .string({
      required_error: "Review text is required",
    })
    .min(3, "Review text is too short"),

  reviewImage: z.string().url().optional(),

  reviewSource: z
    .enum([ReviewSource.FACEBOOK, ReviewSource.WEBSITE])
    .optional(),

  status: z
    .enum([ReviewStatus.PENDING, ReviewStatus.APPROVED, ReviewStatus.REJECTED])
    .optional(),
});

export const updateReviewZodSchema = z.object({
  product: z.string().optional(),

  order: z.string().optional(),

  customerName: z.string().min(2).optional(),

  rating: z.coerce.number().min(1).max(5).optional(),

  reviewText: z.string().min(3).optional(),

 reviewImage: z.string().url().optional(),

  reviewSource: z
    .enum([ReviewSource.FACEBOOK, ReviewSource.WEBSITE])
    .optional(),

  status: z
    .enum([ReviewStatus.PENDING, ReviewStatus.APPROVED, ReviewStatus.REJECTED])
    .optional(),
});
