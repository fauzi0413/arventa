import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { verifyJwt, generateAuthTokens } from "@/lib/auth/jwt";

/**
 * POST /api/auth/refresh
 * Standard endpoint for Refresh Token Rotation (RTR).
 * Validates the refresh token, verifies the user is active, generates a new token pair,
 * and sets updated HttpOnly cookies.
 */
export async function POST(request: NextRequest) {
  try {
    let refreshToken = request.cookies.get("arventa_refresh_token")?.value;

    // Support token in request body as fallback for non-cookie API clients (mobile/desktop apps)
    if (!refreshToken) {
      try {
        const body = await request.json();
        refreshToken = body?.refreshToken;
      } catch {
        // Body was empty or not JSON
      }
    }

    if (!refreshToken) {
      return ApiResponse.unauthorized("Refresh token tidak ditemukan");
    }

    // 1. Verify Refresh Token
    const payload = verifyJwt(refreshToken);
    if (!payload || payload.type !== "refresh" || !payload.userId) {
      // Clear cookies if token is expired/invalid
      const response = ApiResponse.unauthorized("Refresh token tidak valid atau telah kedaluwarsa");
      response.cookies.set("arventa_access_token", "", { path: "/", maxAge: 0 });
      response.cookies.set("arventa_refresh_token", "", { path: "/", maxAge: 0 });
      return response;
    }

    // 2. Verify user in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      const response = ApiResponse.forbidden("Akun pengguna tidak ditemukan atau dinonaktifkan");
      response.cookies.set("arventa_access_token", "", { path: "/", maxAge: 0 });
      response.cookies.set("arventa_refresh_token", "", { path: "/", maxAge: 0 });
      return response;
    }

    // 3. Generate new rotated token pair
    const tokens = generateAuthTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const isProduction = process.env.NODE_ENV === "production";

    // 4. Return new tokens and update cookies
    const response = NextResponse.json({
      success: true,
      message: "Token berhasil diperbarui",
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
    });

    // Set updated access token
    response.cookies.set("arventa_access_token", tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: tokens.expiresIn,
    });

    // Set new rotated refresh token
    response.cookies.set("arventa_refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: tokens.refreshExpiresIn,
    });

    return response;
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal memperbarui token autentikasi",
      error,
    });
  }
}
