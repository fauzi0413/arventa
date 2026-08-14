import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { UserRole } from "@/types/roles";

// ---------------------------------------------------------------------------
// GET /api/auth/me — Retrieve current active user profile & role
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    let authUserEmail: string | undefined;
    let authUserId: string | undefined;

    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        authUserId = authUser.id;
        authUserEmail = authUser.email;
      }
    } catch (err) {
      console.warn("Supabase auth check in me API warning:", err);
    }

    const sessionCookie = request.cookies.get("arventa_session")?.value;
    const demoRoleCookie = (request.cookies.get("arventa_demo_role")?.value as UserRole) || UserRole.OWNER;

    if (!authUserId && !authUserEmail) {
      if (sessionCookie === "true" || request.headers.get("cookie")?.includes("arventa_session=true")) {
        if (demoRoleCookie === UserRole.PLATFORM_ADMIN) authUserEmail = "admin@arventra.id";
        else if (demoRoleCookie === UserRole.HOUSEKEEPING) authUserEmail = "agus.hk@arventra.id";
        else if (demoRoleCookie === UserRole.USER) authUserEmail = "siti.rahma@gmail.com";
        else authUserEmail = "budi@kostsejahtera.com";
      } else {
        return ApiResponse.error({
          message: "Pengguna belum terautentikasi",
          status: 401,
        });
      }
    }

    // Fetch matching user from Prisma DB
    let dbUser: any = await prisma.user.findFirst({
      where: {
        OR: [
          ...(authUserId ? [{ supabaseAuthId: authUserId }] : []),
          ...(authUserEmail ? [{ email: authUserEmail }] : []),
        ],
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      let fullName = "Budi Santoso (Owner)";
      if (demoRoleCookie === UserRole.PLATFORM_ADMIN) fullName = "Super Admin Platform";
      else if (demoRoleCookie === UserRole.HOUSEKEEPING) fullName = "Agus (Housekeeping)";
      else if (demoRoleCookie === UserRole.USER) fullName = "Siti Rahma (Penghuni)";

      dbUser = {
        id: "demo-user-id",
        email: authUserEmail || "owner@arventa.id",
        fullName,
        role: demoRoleCookie,
        isActive: true,
      };
    }

    return ApiResponse.success({
      message: "Profil pengguna berhasil dimuat",
      data: dbUser,
    });
  } catch (error: any) {
    console.error("Error in /api/auth/me:", error);
    return ApiResponse.error({
      message: "Gagal mengambil data sesi pengguna",
      error: error?.message || error,
      status: 500,
    });
  }
}
