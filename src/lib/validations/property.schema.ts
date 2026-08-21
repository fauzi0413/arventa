import { z } from "zod";

export const PropertyTypeEnum = z.enum([
  "KOS",
  "KONTRAKAN",
  "APARTEMEN",
  "RUKO",
]);

export const createPropertySchema = z.object({
  ownerId: z.string().uuid("Invalid Owner ID format"),
  name: z.string().min(3, "Property name must be at least 3 characters"),
  type: PropertyTypeEnum,
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City name is required"),
  description: z.string().optional(),
  coverImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
  hasCleaningService: z.boolean().optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
