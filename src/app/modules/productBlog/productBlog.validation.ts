import { z } from "zod";
import {
  ProductBlogCategory,
  ProductBlogContentType,
  ProductBlogStatus,
} from "./productBlog.constants";

const createProductBlogValidationSchema = z.object({
    title: z
      .string()
      .trim()
      .min(5, "Title must be at least 5 characters")
      .max(200),

    shortDescription: z
      .string()
      .trim()
      .min(5)
      .max(500),

    content: z
      .string()
      .trim()
      .min(10),

    thumbnail: z
      .string()
      .url().optional(),

    category: z.enum(
      Object.values(ProductBlogCategory) as [
        keyof typeof ProductBlogCategory,
        ...(keyof typeof ProductBlogCategory)[]
      ],
    ),

    contentType: z.enum(
      Object.values(ProductBlogContentType) as [
        keyof typeof ProductBlogContentType,
        ...(keyof typeof ProductBlogContentType)[]
      ],
    ),

    videoUrl: z
      .string()
      .url()
      .optional()
      .nullable(),

    tags: z.array(z.string()).default([]),

    featured: z.boolean().optional(),

    readingTime: z
      .number()
      .min(1)
      .optional(),

    status: z.enum(
      Object.values(ProductBlogStatus) as [
        keyof typeof ProductBlogStatus,
        ...(keyof typeof ProductBlogStatus)[]
      ],
    ),
});

export const ProductBlogValidation = {
  createProductBlogValidationSchema,
};