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
      return ApiResponse.badRequest("Email atau password yang Anda masukkan salah.");
    }

    // 2. Check if account is active/verified FIRST
    if (!user.isActive) {
      if (user.role === "OWNER") {
        return ApiResponse.forbidden(
          "Akun Anda belum terverifikasi. Silakan periksa inbox email Anda dan klik tautan verifikasi sebelum melakukan login.",
          { isUnverified: true, email: user.email, role: user.role }
        );
      } else {
        return ApiResponse.forbidden(
          "Akun Anda belum aktif. Aktivasi akun dilakukan oleh Owner Properti Anda. Silakan hubungi Owner Properti Anda untuk mengaktifkan akun.",
          { isUnverified: false, isInactiveNonOwner: true, email: user.email, role: user.role }
        );
      }
    }

    // 3. Ensure user in Supabase Auth is confirmed so password verification works
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseServiceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const { createClient: createSupabaseAdmin } = await import("@supabase/supabase-js");
        const supabaseAdmin = createSupabaseAdmin(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseServiceRoleKey,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        if (user.supabaseAuthId) {
          await supabaseAdmin.auth.admin.updateUserById(user.supabaseAuthId, { email_confirm: true });
        } else {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const target = listData?.users?.find((u) => u.email === cleanEmail);
          if (target) {
            await supabaseAdmin.auth.admin.updateUserById(target.id, { email_confirm: true });
            await prisma.user.update({
              where: { id: user.id },
              data: { supabaseAuthId: target.id },
            });
          }
        }
      } catch (e) {
        console.warn("⚠️ Failed to auto-confirm user in Supabase Auth:", e);
      }
    }

    // 4. Verify password against Supabase Auth
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) {
        console.warn(`⚠️ Login password verification failed for ${cleanEmail}:`, authError.message);
        return ApiResponse.badRequest("Email atau password yang Anda masukkan salah.");
      }
    }

    // 2. Determine actual role from database user table
    const dbRole = user.role;

    // 3. Determine redirect URL based on DB Role (Always redirect to top-most menu for each role)
    let destination = "/owner/dashboard";
    if (dbRole === "TENANT" || dbRole === "USER") {
      destination = "/portal/room";
    } else if (dbRole === "HOUSEKEEPING") {
      destination = "/housekeeping/room-grid";
    } else if ((dbRole as string) === "PLATFORM_ADMIN" || (dbRole as string) === "SUPER_ADMIN") {
      destination = "/platform/dashboard";
    } else {
      destination = "/owner/dashboard";
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
