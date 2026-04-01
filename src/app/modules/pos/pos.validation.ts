import { z } from "zod";

const posProductSchema = z.object({
  product: z.string({
    required_error: "Product ID is required",
  }),
  quantity: z
    .number({
      required_error: "Quantity is required",
    })
    .min(1, "Quantity must be at least 1"),
});

const posCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(6, "Phone is required"),

  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
});

export const createPOSOrderZodSchema = z.object({
  body: z.object({
    products: z
      .array(posProductSchema)
      .min(1, "At least one product is required"),

    customer: posCustomerSchema,

    orderType: z.enum(["PICKUP", "DELIVERY"], {
      required_error: "Order type is required",
    }),
  }),
});

export const updatePOSOrderStatusZodSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]),
  }),
});