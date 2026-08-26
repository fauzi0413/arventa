import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { verifyJwt, signJwt } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/refresh
 * Refresh short-lived Access Token using valid Refresh Token from HttpOnly cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const refreshTokenCookie = request.cookies.get("arventa_refresh_token")?.value;

    if (!refreshTokenCookie) {
      return ApiResponse.unauthorized("Sesi refresh token telah habis. Silakan login kembali.");
    }

    const payload = verifyJwt(refreshTokenCookie);

    if (!payload || payload.type !== "refresh") {
      return ApiResponse.unauthorized("Refresh token tidak valid atau telah kedaluwarsa.");
    }

    // Verify user in PostgreSQL DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return ApiResponse.unauthorized("Akun pengguna tidak ditemukan atau tidak aktif.");
    }

    // Issue new 15-minute Access Token
    const newAccessToken = signJwt(
      { userId: user.id, email: user.email, role: user.role, type: "access" },
      15 * 60
    );

    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.json({
      success: true,
      message: "Token berhasil diperbarui",
    });

    response.cookies.set("arventa_access_token", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    return response;
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal memperbarui token autentikasi",
      error,
    });
  }
}
