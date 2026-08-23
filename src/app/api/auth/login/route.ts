import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/login
 * Verify user login credentials against PostgreSQL DB and return actual role & destination route.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return ApiResponse.badRequest("Email wajib diisi");
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if user exists in PostgreSQL DB
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

    // 2. Determine actual role from database
    const dbRole = user.role; // 'TENANT', 'OWNER', 'HOUSEKEEPING', 'USER', 'PLATFORM_ADMIN', 'SUPER_ADMIN'

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

    return ApiResponse.success({
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
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal melakukan verifikasi login",
      error,
    });
  }
}
