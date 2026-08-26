import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/auth/jwt";

/**
 * POST /api/auth/login
 * Verify user login credentials against PostgreSQL DB, generate Access & Refresh JWTs,
 * and set HttpOnly cookies with 'Remember Me' support. Fully Vercel compatible!
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    if (!email) {
      return ApiResponse.badRequest("Email wajib diisi");
    }

    if (!password) {
      return ApiResponse.badRequest("Password wajib diisi");
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if user exists in PostgreSQL DB (User table)
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        unitAccount: true,
        tenantProfile: true,
      },
    });

    if (!user) {
      return ApiResponse.notFound(`Akun dengan email '${cleanEmail}' tidak ditemukan dalam database.`);
    }

    if (!user.isActive) {
      return ApiResponse.forbidden(
        "Akun Anda belum terverifikasi. Silakan periksa inbox email Anda dan klik tautan verifikasi sebelum melakukan login."
      );
    }

    // 2. Determine actual role from database user table
    const dbRole = user.role;

    // 3. Determine redirect URL based on DB Role
    let destination = "/properties";
    if (dbRole === "TENANT" || dbRole === "USER") {
      destination = "/portal/room";
    } else if (dbRole === "HOUSEKEEPING") {
      destination = "/housekeeping";
    } else if ((dbRole as string) === "PLATFORM_ADMIN" || (dbRole as string) === "SUPER_ADMIN") {
      destination = "/platform/dashboard";
    } else {
      destination = "/properties";
    }

    // 4. Generate Short-lived Access Token (15 min) & Long-lived Refresh Token (7 days)
    const accessToken = signJwt(
      { userId: user.id, email: user.email, role: dbRole, type: "access" },
      15 * 60 // 15 minutes
    );

    const refreshToken = signJwt(
      { userId: user.id, email: user.email, role: dbRole, type: "refresh" },
      7 * 24 * 60 * 60 // 7 days
    );

    // 5. Create Response and set secure HttpOnly cookies
    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: dbRole,
        destination,
        unitNumber: user.unitAccount?.unitNumber,
      },
    });

    const isProduction = process.env.NODE_ENV === "production";

    // Access Token Cookie (Short-lived 15 min)
    response.cookies.set("arventa_access_token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    // Refresh Token Cookie (If rememberMe = true: 7 days, else Session Cookie)
    response.cookies.set("arventa_refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 } : {}),
    });

    // Client session fallback cookies
    response.cookies.set("arventa_session", "true", {
      path: "/",
      sameSite: "lax",
      ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 } : {}),
    });
    response.cookies.set("arventa_demo_role", dbRole, {
      path: "/",
      sameSite: "lax",
      ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 } : {}),
    });
    response.cookies.set("arventa_user_email", encodeURIComponent(user.email), {
      path: "/",
      sameSite: "lax",
      ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 } : {}),
    });

    return response;
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal melakukan verifikasi login",
      error,
    });
  }
}
