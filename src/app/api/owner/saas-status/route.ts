import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { getOwnerQuotaMetrics } from "@/lib/saas-features";

/**
 * GET /api/owner/saas-status
 * Returns current authenticated owner's SaaS subscription status, feature gating codes, quota limits, and quota exceeded status
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return ApiResponse.unauthorized("Belum terautentikasi");
    }

    const saasStatus = await getOwnerQuotaMetrics(authUser.id);

    return ApiResponse.success({
      message: "Berhasil mengambil status langganan SaaS",
      data: saasStatus,
    });
  } catch (error: any) {
    console.error("GET /api/owner/saas-status error:", error);
    return ApiResponse.error({
      message: "Gagal mengambil status langganan SaaS",
      error,
      status: 500,
    });
  }
}

