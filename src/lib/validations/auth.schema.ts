import { z } from "zod";
import { UserRole } from "@/types/roles";

// ---------------------------------------------------------------------------
// Login Validation Schema
// ---------------------------------------------------------------------------
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Register Validation Schema
// ---------------------------------------------------------------------------
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Nama lengkap minimal 3 karakter"),
    email: z
      .string()
      .min(1, "Email wajib diisi")
      .email("Format email tidak valid"),
    phoneNumber: z
      .string()
      .min(1, "Nomor HP / WhatsApp wajib diisi")
      .min(10, "Nomor HP / WhatsApp minimal 10 digit")
      .regex(/^[0-9+\-\s]+$/, "Nomor telepon hanya boleh berisi angka"),
    role: z.nativeEnum(UserRole, {
      errorMap: () => ({ message: "Pilih peran yang valid" }),
    }),
    password: z
      .string()
      .min(1, "Password wajib diisi")
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf besar (A-Z)")
      .regex(/[0-9]/, "Password harus mengandung minimal 1 angka (0-9)"),
    confirmPassword: z
      .string()
      .min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok dengan password",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
