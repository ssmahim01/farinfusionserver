import { z } from "zod";

export const createPermissionZodSchema = z.object({
  title: z.string(),
  url: z.string(),
  group: z.string(),
});

export const updateUserPermissionZodSchema = z.object({
  permissions: z.array(z.string()),
});