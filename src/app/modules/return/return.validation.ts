import { z } from "zod";
import {
  RefundStatus,
  ReturnReason,
  ReturnStatus,
  ReturnType,
} from "./return.interface";

const returnedProductValidationSchema = z.object({
  body: z.object({
    product: z.string({
      required_error: "Product is required",
    }),

    quantity: z
      .number({
        required_error: "Quantity is required",
      })
      .min(1),

    reason: z.nativeEnum(ReturnReason),

    shouldRestock: z.boolean().optional(),

    isDamaged: z.boolean().optional(),

    notes: z.string().optional(),
  }),
});

const createReturnValidationSchema = z.object({
  body: z.object({
    order: z.string({
      required_error: "Order is required",
    }),

    returnType: z.nativeEnum(ReturnType),

    refundAmount: z.number().min(0).optional(),

    refundStatus: z.nativeEnum(RefundStatus).optional(),

    notes: z.string().optional(),

    returnedProducts: z
      .array(returnedProductValidationSchema)
      .min(1, "At least one product is required"),
  }),
});

const updateReturnStatusValidationSchema = z.object({
  body: z.object({
    returnStatus: z.nativeEnum(ReturnStatus).optional(),
    refundStatus: z.nativeEnum(RefundStatus).optional(),
  }),
});

export const ReturnValidations = {
  createReturnValidationSchema,
  updateReturnStatusValidationSchema,
};
