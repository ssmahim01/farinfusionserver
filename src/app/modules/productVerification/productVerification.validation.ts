import { z } from "zod";
import {
  VerificationCategory,
  VerificationContentType,
  VerificationStatus,
} from "./productVerification.constants";

const createProductVerificationValidationSchema = z.object({
    title: z
      .string({
        required_error: "Title is required",
      })
      .trim()
      .min(3),

    slug: z
      .string()
      .trim()
      .toLowerCase().optional(),

    shortDescription: z
      .string({
        required_error: "Short description is required",
      })
      .trim()
      .min(10),

    description: z.string().optional(),

    thumbnail: z.string().optional(),

    mediaUrl: z.string().url(),

    mediaType: z.enum(
      Object.values(VerificationContentType) as [string, ...string[]],
    ),

    category: z.enum(
      Object.values(VerificationCategory) as [string, ...string[]],
    ),

    tags: z.array(z.string()).default([]),

    featured: z.boolean().optional(),

    status: z
      .enum(Object.values(VerificationStatus) as [string, ...string[]])
      .optional(),
});

export const ProductVerificationValidation = {
  createProductVerificationValidationSchema,
};