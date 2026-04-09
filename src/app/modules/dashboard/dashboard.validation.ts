import { z } from "zod";

export const dashboardQuerySchema = z.object({
  "createdAt[gte]": z.string().optional(),
  "createdAt[lte]": z.string().optional(),
  orderStatus: z.string().optional(),
});