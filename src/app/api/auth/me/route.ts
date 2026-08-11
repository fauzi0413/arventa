import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";

// ---------------------------------------------------------------------------
// GET /api/auth/me — Retrieve current active user profile & role
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return ApiResponse.error({
        message: "Pengguna belum terautentikasi",
        statusCode: 401,
      });
    }

    // Fetch matching user from Prisma DB
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseAuthId: authUser.id },
          { email: authUser.email || "" },
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
      return ApiResponse.error({
        message: "Data profil pengguna tidak ditemukan di database",
        statusCode: 404,
      });
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
      statusCode: 500,
    });
  }
}
