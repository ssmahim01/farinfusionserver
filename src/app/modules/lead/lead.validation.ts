import { z } from "zod";
import { LeadStatus, LeadPriority } from "./lead.interface";

// ─── Create Lead Schema ─────────────────────────────────────────
export const createLeadZodSchema = z.object({
    name: z
        .string({ required_error: "Name is required" })
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters")
        .trim(),

    email: z
        .string({ required_error: "Email is required" })
        .email("Invalid email address")
        .toLowerCase()
        .trim(),

    phone: z
        .string({ required_error: "Phone is required" })
        .regex(/^[+]?[0-9]{7,15}$/, "Invalid phone number")
        .trim(),

    address: z
        .string({ required_error: "Address is required" })
        .min(5, "Address must be at least 5 characters")
        .max(255, "Address must not exceed 255 characters")
        .trim(),
    
    social : z 
        .string({required_error: "Social Media required"})
        .optional(),

    status: z
        .nativeEnum(LeadStatus, {
            errorMap: () => ({
                message: `Status must be one of: ${Object.values(LeadStatus).join(", ")}`,
            }),
        })
        .optional()
        .default(LeadStatus.NEW),

    isDeleted: z
        .boolean({ invalid_type_error: "isDeleted must be true or false" })
        .optional(),
    priority: z
        .nativeEnum(LeadPriority, {
            errorMap: () => ({
                message: `Priority must be one of: ${Object.values(LeadPriority).join(", ")}`,
            }),
        })
        .optional()
        .default(LeadPriority.MEDIUM),

    assignedBy: z
        .string()
        .regex(/^[a-fA-F0-9]{24}$/, "Invalid assignedBy ID")
        .optional(),

    followUpDate: z
        .string()
        .datetime({ message: "Invalid date format" })
        .or(z.date())
        .optional()
        .refine(
            (val) => !val || new Date(val) > new Date(),
            "Follow-up date must be in the future"
        ),

    notes: z
        .string()
        .max(1000, "Notes must not exceed 1000 characters")
        .trim()
        .optional(),
});

// ─── Update Lead Schema ─────────────────────────────────────────
export const updateLeadZodSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters")
        .trim()
        .optional(),

    email: z
        .string()
        .email("Invalid email address")
        .toLowerCase()
        .trim()
        .optional(),

    phone: z
        .string()
        .regex(/^[+]?[0-9]{7,15}$/, "Invalid phone number")
        .trim()
        .optional(),

    address: z
        .string()
        .min(5, "Address must be at least 5 characters")
        .max(255, "Address must not exceed 255 characters")
        .trim()
        .optional(),
    social : z 
    .string({required_error: "Social Media required"})
    .optional(),

    status: z
        .nativeEnum(LeadStatus, {
            errorMap: () => ({
                message: `Status must be one of: ${Object.values(LeadStatus).join(", ")}`,
            }),
        })
        .optional(),

    isDeleted: z
        .boolean({ invalid_type_error: "isDeleted must be true or false" })
        .optional(),

    priority: z
        .nativeEnum(LeadPriority, {
            errorMap: () => ({
                message: `Priority must be one of: ${Object.values(LeadPriority).join(", ")}`,
            }),
        })
        .optional(),

    assignedBy: z
        .string()
        .regex(/^[a-fA-F0-9]{24}$/, "Invalid assignedBy ID")
        .optional(),

    followUpDate: z
        .string()
        .datetime({ message: "Invalid date format" })
        .or(z.date())
        .optional()
        .refine(
            (val) => !val || new Date(val) > new Date(),
            "Follow-up date must be in the future"
        ),

    notes: z
        .string()
        .max(1000, "Notes must not exceed 1000 characters")
        .trim()
        .optional(),
})