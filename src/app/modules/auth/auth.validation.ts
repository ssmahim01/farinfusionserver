import { z } from "zod";

export const changePasswordZodSchema = z.object({
    oldPassword: z
        .string({ invalid_type_error: "Password must be string" }),
        // .min(8, { message: "Password must be at least 8 characters long." }),
    newPassword: z
        .string({ invalid_type_error: "Password must be string" })
        .min(8, { message: "Password must be at least 8 characters long." })
})