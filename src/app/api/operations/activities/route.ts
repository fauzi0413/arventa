import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { HousekeepingService } from "@/services/housekeeping.service";
import { activityFilterSchema } from "@/lib/validations/housekeeping.schema";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";

/**
 * GET /api/operations/activities
 * Unified activity monitoring feed for housekeeping & property operations
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    if (authUser.role !== UserRole.OWNER && authUser.role !== UserRole.PLATFORM_ADMIN) {
      return ApiResponse.forbidden("Hanya owner atau admin yang memiliki akses ke aktivitas operasional.");
    }

    const isPlatformAdmin = authUser.role === UserRole.PLATFORM_ADMIN;
    const ownerId = authUser.id;

    const { searchParams } = new URL(request.url);
    const queryParams = {
      propertyId: searchParams.get("propertyId") || undefined,
      type: searchParams.get("type") || "ALL",
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    };

    const validation = activityFilterSchema.safeParse(queryParams);
    if (!validation.success) {
      return ApiResponse.badRequest(
        "Filter parameter tidak valid",
        validation.error.flatten().fieldErrors
      );
    }

    const result = await HousekeepingService.getHousekeepingActivities(
      ownerId,
      validation.data,
      isPlatformAdmin
    );

    return ApiResponse.success({
      message: "Riwayat aktivitas berhasil dimuat",
      data: result.items,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error("GET /api/operations/activities error:", error);
    return ApiResponse.error({
      message: "Gagal memuat log aktivitas operasional",
      error: error?.message || error,
      status: 500,
    });
  }
}
