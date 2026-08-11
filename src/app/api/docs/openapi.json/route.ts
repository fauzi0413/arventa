import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/swagger/openapi-spec";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponse.error({
        message: "Akses ditolak. Anda harus login terlebih dahulu.",
        status: 401,
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { role: true },
    });

    const userRole = dbUser?.role || user.user_metadata?.role;

    if (userRole !== "PLATFORM_ADMIN") {
      return ApiResponse.error({
        message: "Akses ditolak. Khusus Platform Admin.",
        status: 403,
      });
    }

    return NextResponse.json(openApiSpec);
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal mengambil spesifikasi OpenAPI",
      error,
      status: 500,
    });
  }
}
