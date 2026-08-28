import { z } from "zod";

export const PropertyTypeEnum = z.enum([
  "KOS",
  "KONTRAKAN",
  "APARTEMEN",
  "RUKO",
]);

export const createPropertySchema = z.object({
  ownerId: z.string().min(1, "Invalid Owner ID format").optional(),
  name: z.string().min(3, "Nama properti minimal 3 karakter"),
  type: PropertyTypeEnum,
  address: z.string().min(5, "Alamat minimal 5 karakter"),
  city: z.string().min(2, "Nama kota minimal 2 karakter").optional().default("Jakarta"),
  description: z.string().optional().or(z.literal("")),
  coverImage: z.string().optional().or(z.literal("")),
  hasCleaningService: z.boolean().optional().default(true),
  totalUnits: z.number().int().min(0).optional(),
  occupiedUnits: z.number().int().min(0).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
