import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { UserRole } from "@/types/roles";
import { verifyJwt } from "@/lib/auth/jwt";

// ---------------------------------------------------------------------------
// GET /api/auth/me — Retrieve current active user profile & role
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    let authUserEmail: string | undefined;
    let authUserId: string | undefined;

    // 1. First check JWT Access Token / Refresh Token from HttpOnly cookies
    const accessTokenCookie = request.cookies.get("arventa_access_token")?.value;
    const refreshTokenCookie = request.cookies.get("arventa_refresh_token")?.value;

    if (accessTokenCookie) {
      const jwtPayload = verifyJwt(accessTokenCookie);
      if (jwtPayload?.email) {
        authUserEmail = jwtPayload.email;
        authUserId = jwtPayload.userId;
      }
    }

    if (!authUserEmail && refreshTokenCookie) {
      const refreshPayload = verifyJwt(refreshTokenCookie);
      if (refreshPayload?.email) {
        authUserEmail = refreshPayload.email;
        authUserId = refreshPayload.userId;
      }
    }

    if (!authUserEmail) {
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
    }

    const sessionCookie = request.cookies.get("arventa_session")?.value;
    const demoRoleCookie = (request.cookies.get("arventa_demo_role")?.value as UserRole) || UserRole.OWNER;
    const userEmailCookie = request.cookies.get("arventa_user_email")?.value;

    if (!authUserId && !authUserEmail) {
      if (userEmailCookie) {
        authUserEmail = userEmailCookie;
      } else if (sessionCookie === "true" || request.headers.get("cookie")?.includes("arventa_session=true")) {
        if (demoRoleCookie === UserRole.PLATFORM_ADMIN) authUserEmail = "admin@arventa.id";
        else if (demoRoleCookie === UserRole.HOUSEKEEPING) authUserEmail = "agus.hk@arventa.id";
        else if (demoRoleCookie === UserRole.USER) authUserEmail = "apt12b01@arventa.id";
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
      else if (demoRoleCookie === UserRole.USER) fullName = "Siti Rahmawati (Penghuni)";

      dbUser = {
        id: "demo-user-id",
        email: authUserEmail || "owner@arventa.id",
        fullName,
        role: demoRoleCookie,
        isActive: true,
      };
    } else if (dbUser.role === "TENANT" || dbUser.role === "USER") {
      const unit = await prisma.unit.findFirst({
        where: {
          OR: [
            { unitUserId: dbUser.id },
            { unitUser: { email: dbUser.email } },
            { leases: { some: { tenant: { user: { email: dbUser.email } } } } },
          ],
        },
        include: {
          leases: {
            where: { status: "ACTIVE" },
            take: 1,
            include: {
              tenant: { include: { user: true } },
            },
          },
        },
      });

      if (unit && unit.leases[0]?.tenant) {
        const tenant = unit.leases[0].tenant;
        const tenantName = tenant.fullName || tenant.user?.fullName;
        if (tenantName) {
          dbUser.fullName = `${tenantName} (Penghuni)`;
        }
      }
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

/**
 * PUT /api/auth/me — Update profile details (fullName & phoneNumber only)
 */
export async function PUT(request: NextRequest) {
  try {
    const { getAuthenticatedUser } = await import("@/lib/auth/get-authenticated-user");
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Belum terautentikasi");
    }

    const body = await request.json();
    const { fullName, phoneNumber } = body;

    if (!fullName || String(fullName).trim() === "") {
      return ApiResponse.error({
        message: "Nama lengkap wajib diisi",
        status: 400,
      });
    }

    // Update ONLY fullName and phoneNumber in Prisma DB
    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        fullName: String(fullName).trim(),
        phoneNumber: phoneNumber !== undefined && phoneNumber !== null ? String(phoneNumber).replace(/[^0-9]/g, "") : null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
        role: true,
        isActive: true,
      },
    });

    return ApiResponse.success({
      message: "Profil Anda berhasil diperbarui",
      data: updatedUser,
    });
  } catch (error: any) {
    console.error("PUT /api/auth/me error:", error);
    return ApiResponse.error({
      message: "Gagal memperbarui profil",
      error: error?.message || error,
      status: 500,
    });
  }
}
