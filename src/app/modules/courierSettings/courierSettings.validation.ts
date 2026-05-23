import { z } from "zod";
import { CourierProvider } from "./courierSettings.interface";

const pickupInfoSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  area: z.string().optional(),
  city: z.string().optional(),
});

export const createCourierSettingsZodSchema = z.object({

    provider: z.nativeEnum(CourierProvider),

    displayName: z.string({
      required_error: "Display name is required",
    }),

    config: z.record(z.string(), z.string()).refine(
      (val) => Object.keys(val).length > 0,
      {
        message: "At least one config field is required",
      },
    ),

    pickupInfo: pickupInfoSchema.optional(),

    webhookUrl: z.string().optional(),

    notes: z.string().optional(),

    isActive: z.boolean().optional(),

    isSandbox: z.boolean().optional(),
});

export const updateCourierSettingsZodSchema = z.object({
    displayName: z.string().optional(),

    config: z.record(z.string(), z.string()).optional(),

    pickupInfo: pickupInfoSchema.optional(),

    webhookUrl: z.string().optional(),

    notes: z.string().optional(),

    isActive: z.boolean().optional(),

    isSandbox: z.boolean().optional(),
});