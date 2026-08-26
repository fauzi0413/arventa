import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { verifyJwt } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/verify-email?token=...
 * Verify user email verification token and activate user (isActive: true).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return ApiResponse.badRequest("Token verifikasi tidak ditemukan.");
    }

    const payload = verifyJwt(token);

    if (!payload || payload.type !== "verify") {
      return ApiResponse.badRequest("Token verifikasi tidak valid atau telah kedaluwarsa.");
    }

    // Find and update user in Prisma DB
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      return ApiResponse.notFound("Pengguna dengan email ini tidak ditemukan.");
    }

    if (user.isActive) {
      return ApiResponse.success({
        message: "Akun Anda sudah terverifikasi dan aktif. Silakan login.",
        data: { email: user.email, alreadyVerified: true },
      });
    }

    // Activate user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true },
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });

    return ApiResponse.success({
      message: "Verifikasi email berhasil! Akun Anda telah aktif dan siap digunakan untuk login.",
      data: updatedUser,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal memproses verifikasi email.",
      error,
    });
  }
}
