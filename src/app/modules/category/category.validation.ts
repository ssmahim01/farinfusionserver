import { z } from "zod";
import { CategoryStatus } from "./category.interface";

export const createCategoryZodSchema = z.object({
  title: z
    .string({ invalid_type_error: "Title must be a string" })
    .min(1, { message: "Title is required" }),
  description: z
    .string({ invalid_type_error: "Description must be a string" })
    .min(1, { message: "Description is required" }),
  image: z.string({ invalid_type_error: "Image must be a string" }).optional(),
  status: z
    .enum([CategoryStatus.ACTIVE, CategoryStatus.INACTIVE], {
      invalid_type_error: "Status must be either ACTIVE or INACTIVE",
    })
    .optional(),
  slug: z.string({ invalid_type_error: "Slug must be a string" }).optional(),

  isDeleted: z
    .boolean({ invalid_type_error: "isDeleted must be true or false" })
    .optional(),

  // 🔹 New: showOrder
  // 🔹 showOrder: preprocess to convert string to number
  showOrder: z.preprocess(
    (val) => {
      if (typeof val === "string") return Number(val);
      return val;
    },
    z
      .number({ invalid_type_error: "Show order must be a number" })
      .int("Show order must be an integer")
      .positive("Show order must be positive")
      .optional()
  ),
});

// -----------------------------
// Update Category Schema
// -----------------------------
export const updateCategoryZodSchema = z.object({
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
    .enum([CategoryStatus.ACTIVE, CategoryStatus.INACTIVE], {
      invalid_type_error: "Status must be either ACTIVE or INACTIVE",
    })
    .optional(),
  slug: z.string({ invalid_type_error: "Slug must be a string" }).optional(),

  isDeleted: z
    .boolean({ invalid_type_error: "isDeleted must be true or false" })
    .optional(),

  // 🔹 New: showOrder optional
  // 🔹 showOrder: preprocess to convert string to number
  showOrder: z.preprocess(
    (val) => {
      if (typeof val === "string") return Number(val);
      return val;
    },
    z
      .number({ invalid_type_error: "Show order must be a number" })
      .int("Show order must be an integer")
      .positive("Show order must be positive")
      .optional()
  ),
});