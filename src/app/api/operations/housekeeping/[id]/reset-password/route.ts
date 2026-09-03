import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { HousekeepingService } from "@/services/housekeeping.service";
import { resetHousekeepingPasswordSchema } from "@/lib/validations/housekeeping.schema";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";

/**
 * POST /api/operations/housekeeping/[id]/reset-password
 * Reset password for a housekeeping staff
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    // Role check: must be OWNER or PLATFORM_ADMIN
    if (authUser.role !== UserRole.OWNER && authUser.role !== UserRole.PLATFORM_ADMIN) {
      return ApiResponse.forbidden("Hanya owner atau admin yang memiliki wewenang mereset password staf.");
    }

    const isPlatformAdmin = authUser.role === UserRole.PLATFORM_ADMIN;
    const ownerId = authUser.id;

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const validation = resetHousekeepingPasswordSchema.safeParse(body);
    if (!validation.success) {
      return ApiResponse.badRequest(
        "Validasi input password gagal",
        validation.error.flatten().fieldErrors
      );
    }

    const result = await HousekeepingService.resetStaffPassword(
      ownerId,
      id,
      validation.data.password,
      isPlatformAdmin
    );

    return ApiResponse.success({
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/operations/housekeeping/[id]/reset-password error:", error);
    return ApiResponse.error({
      message: error?.message || "Gagal melakukan reset password",
      error: error?.message || error,
      status: 400,
    });
  }
}
