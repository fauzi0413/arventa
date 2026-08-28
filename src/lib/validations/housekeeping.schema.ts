import { z } from "zod";

export const createHousekeepingSchema = z.object({
  fullName: z
    .string()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  email: z
    .string()
    .email("Format email tidak valid")
    .toLowerCase(),
  phoneNumber: z
    .string()
    .min(8, "Nomor telepon minimal 8 digit")
    .max(20, "Nomor telepon maksimal 20 digit"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .optional(),
  propertyIds: z
    .array(z.string().min(1, "ID properti tidak valid"))
    .min(1, "Pilih minimal 1 properti untuk penugasan housekeeping"),
  isActive: z.boolean().default(true),
});

export const updateHousekeepingSchema = z.object({
  fullName: z
    .string()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter")
    .optional(),
  phoneNumber: z
    .string()
    .min(8, "Nomor telepon minimal 8 digit")
    .max(20, "Nomor telepon maksimal 20 digit")
    .optional(),
  isActive: z.boolean().optional(),
  propertyIds: z
    .array(z.string().min(1, "ID properti tidak valid"))
    .optional(),
});

export const resetHousekeepingPasswordSchema = z.object({
  password: z
    .string()
    .min(6, "Password baru minimal 6 karakter")
    .max(50, "Password maksimal 50 karakter"),
});

export const activityFilterSchema = z.object({
  propertyId: z.string().optional(),
  type: z.enum(["ALL", "ROOM_STATUS", "CHECKIN_CHECKOUT", "EXPENSE"]).optional().default("ALL"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateHousekeepingInput = z.infer<typeof createHousekeepingSchema>;
export type UpdateHousekeepingInput = z.infer<typeof updateHousekeepingSchema>;
export type ResetHousekeepingPasswordInput = z.infer<typeof resetHousekeepingPasswordSchema>;
export type ActivityFilterInput = z.infer<typeof activityFilterSchema>;
