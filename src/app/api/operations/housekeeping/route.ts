import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { HousekeepingService } from "@/services/housekeeping.service";
import { createHousekeepingSchema } from "@/lib/validations/housekeeping.schema";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";

/**
 * GET /api/operations/housekeeping
 * Fetch all housekeeping staff assigned to the owner's properties.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    if (authUser.role !== UserRole.OWNER && authUser.role !== UserRole.PLATFORM_ADMIN) {
      return ApiResponse.forbidden("Hanya owner atau admin yang memiliki akses ke tim housekeeping.");
    }

    const isPlatformAdmin = authUser.role === UserRole.PLATFORM_ADMIN;
    const ownerId = authUser.id;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const propertyId = searchParams.get("propertyId") || undefined;
    const status = (searchParams.get("status") as any) || "ALL";
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10;

    const result = await HousekeepingService.getHousekeepingTeam(
      ownerId,
      {
        search,
        propertyId,
        status,
        page,
        limit,
      },
      isPlatformAdmin
    );

    return ApiResponse.success({
      message: "Daftar housekeeping berhasil dimuat",
      data: result.items,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error("GET /api/operations/housekeeping error:", error);
    return ApiResponse.error({
      message: "Gagal memuat data staf housekeeping",
      error: error?.message || error,
      status: 500,
    });
  }
}

/**
 * POST /api/operations/housekeeping
 * Create a new housekeeping staff account and assign to properties.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    if (authUser.role !== UserRole.OWNER && authUser.role !== UserRole.PLATFORM_ADMIN) {
      return ApiResponse.forbidden("Hanya owner atau admin yang memiliki wewenang menambahkan staf.");
    }

    const isPlatformAdmin = authUser.role === UserRole.PLATFORM_ADMIN;
    const ownerId = authUser.id;

    const body = await request.json().catch(() => ({}));
    const validation = createHousekeepingSchema.safeParse(body);

    if (!validation.success) {
      return ApiResponse.badRequest(
        "Validasi input gagal",
        validation.error.flatten().fieldErrors
      );
    }

    const newStaff = await HousekeepingService.createHousekeeping(
      ownerId,
      validation.data,
      isPlatformAdmin
    );

    return ApiResponse.success({
      message: `Akun housekeeping '${newStaff.fullName}' berhasil dibuat`,
      data: newStaff,
      status: 201,
    });
  } catch (error: any) {
    console.error("POST /api/operations/housekeeping error:", error);
    return ApiResponse.error({
      message: error?.message || "Gagal menambahkan staf housekeeping",
      error: error?.message || error,
      status: 400,
    });
  }
}
