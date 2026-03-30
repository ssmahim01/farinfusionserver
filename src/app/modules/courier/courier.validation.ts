import { z } from "zod";

export const createCourierZodSchema = z.object({
  orderId: z
    .string({
      required_error: "Order ID is required",
      invalid_type_error: "Order ID must be a string",
    })
    .min(1, "Order ID cannot be empty"),
});

export const trackCourierZodSchema = z.object({
  trackingCode: z
    .string({
      required_error: "Tracking code is required",
      invalid_type_error: "Tracking code must be a string",
    })
    .min(1, "Tracking code cannot be empty"),
});