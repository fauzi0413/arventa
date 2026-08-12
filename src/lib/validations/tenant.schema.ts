import { z } from "zod";

export const createTenantSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  phoneNumber: z.string().optional().or(z.literal("")),
  nik: z.string().length(16, "NIK harus 16 digit").optional().or(z.literal("")),
  ktpImageUrl: z.string().url("URL gambar KTP tidak valid").optional().or(z.literal("")),
  emergencyName: z.string().optional().or(z.literal("")),
  emergencyPhone: z.string().optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
});

export const updateTenantSchema = createTenantSchema.partial();

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
