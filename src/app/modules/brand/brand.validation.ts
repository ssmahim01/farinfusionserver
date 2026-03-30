import { z } from "zod";
import { BrandStatus } from "./brand.interface";

// Create Brand Schema
export const createBrandZodSchema = z.object({
  title: z
    .string({ invalid_type_error: "Title must be a string" })
    .min(1, { message: "Title is required" }),
  description: z
    .string({ invalid_type_error: "Description must be a string" })
    .min(1, { message: "Description is required" }),
  image: z.string({ invalid_type_error: "Image must be a string" }).optional(),
  status: z
    .enum([BrandStatus.ACTIVE, BrandStatus.INACTIVE], {
      invalid_type_error: "Status must be either ACTIVE or INACTIVE",
    })
    .optional(),
  slug: z.string({ invalid_type_error: "Slug must be a string" }).optional(),
  isDeleted: z
    .boolean({ invalid_type_error: "isDeleted must be true or false" })
    .optional(),
});

// Update Brand Schema
export const updateBrandZodSchema = z.object({
  title: z
    .string({ invalid_type_error: "Title must be a string" })
    .min(1, { message: "Title is required" })
    .optional(),
  description: z
    .string({ invalid_type_error: "Description must be a string" })
    .min(1, { message: "Description is required" })
    .optional(),
  image: z.string({ invalid_type_error: "Image must be a string" }).optional(),
  status: z
    .enum([BrandStatus.ACTIVE, BrandStatus.INACTIVE], {
      invalid_type_error: "Status must be either ACTIVE or INACTIVE",
    })
    .optional(),
  slug: z.string({ invalid_type_error: "Slug must be a string" }).optional(),
  isDeleted: z
    .boolean({ invalid_type_error: "isDeleted must be true or false" })
    .optional(),
});