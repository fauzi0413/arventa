import { z } from "zod";

export const createTenantSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  phoneNumber: z.string().optional().or(z.literal("")),
  nik: z.string().optional().or(z.literal("")),
  ktpImageUrl: z.string().optional().or(z.literal("")),
  birthPlaceDate: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  bloodType: z.string().optional().or(z.literal("")),
  addressKtp: z.string().optional().or(z.literal("")),
  rtRw: z.string().optional().or(z.literal("")),
  kelDesa: z.string().optional().or(z.literal("")),
  kecamatan: z.string().optional().or(z.literal("")),
  religion: z.string().optional().or(z.literal("")),
  maritalStatus: z.string().optional().or(z.literal("")),
  nationality: z.string().optional().or(z.literal("")),
  validUntil: z.string().optional().or(z.literal("")),
  emergencyName: z.string().optional().or(z.literal("")),
  emergencyPhone: z.string().optional().or(z.literal("")),
  emergencyRelation: z.string().optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  status: z.string().optional().or(z.literal("")),
  unitName: z.string().optional().or(z.literal("")),
  propertyName: z.string().optional().or(z.literal("")),
  leaseStartDate: z.string().optional().or(z.literal("")),
});

export const updateTenantSchema = createTenantSchema.partial();

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
