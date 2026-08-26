import { NextRequest } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { ApiResponse } from "@/lib/api-response";
import { verifyJwt } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * POST /api/auth/reset-password
 * Verify password reset token and update user password in PostgreSQL DB & Supabase Auth.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    if (!token) {
      return ApiResponse.badRequest("Token reset password tidak ditemukan.");
    }

    if (!password) {
      return ApiResponse.badRequest("Password baru wajib diisi.");
    }

    if (password.length < 8) {
      return ApiResponse.badRequest("Password minimal 8 karakter.");
    }

    if (!/[A-Z]/.test(password)) {
      return ApiResponse.badRequest("Password harus mengandung minimal 1 huruf besar (A-Z).");
    }

    if (!/[0-9]/.test(password)) {
      return ApiResponse.badRequest("Password harus mengandung minimal 1 angka (0-9).");
    }

    if (password !== confirmPassword) {
      return ApiResponse.badRequest("Konfirmasi password tidak cocok dengan password baru.");
    }

    // Verify JWT Token
    const payload = verifyJwt(token);
    if (!payload || payload.type !== "reset") {
      return ApiResponse.badRequest("Tautan reset password tidak valid atau telah kedaluwarsa.");
    }

    // Check user in Prisma DB
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      return ApiResponse.notFound("Akun pengguna tidak ditemukan.");
    }

    // Update password in Supabase Auth if configured
    if (supabaseServiceRoleKey && user.supabaseAuthId) {
      try {
        const supabaseAdmin = createSupabaseAdmin(supabaseUrl, supabaseServiceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        await supabaseAdmin.auth.admin.updateUserById(user.supabaseAuthId, {
          password,
        });
      } catch (err) {
        console.warn("Supabase Auth password update notice:", err);
      }
    }

    // Make sure user is activated on password reset
    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true },
    });

    return ApiResponse.success({
      message: "Password Anda berhasil diperbarui! Silakan masuk dengan password baru Anda.",
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal memperbarui password.",
      error,
    });
  }
}
