import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { HousekeepingService } from "@/services/housekeeping.service";
import { updateHousekeepingSchema } from "@/lib/validations/housekeeping.schema";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";

/**
 * GET /api/operations/housekeeping/[id]
 * Get single housekeeping profile & assigned properties
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    if (authUser.role !== UserRole.OWNER && authUser.role !== UserRole.PLATFORM_ADMIN) {
      return ApiResponse.forbidden("Hanya owner atau admin yang memiliki wewenang mengakses profil staf.");
    }

    const isPlatformAdmin = authUser.role === UserRole.PLATFORM_ADMIN;
    const ownerId = authUser.id;

    const { id } = await context.params;
    const staff = await HousekeepingService.getHousekeepingById(ownerId, id, isPlatformAdmin);

    return ApiResponse.success({
      message: "Profil housekeeping berhasil dimuat",
      data: staff,
    });
  } catch (error: any) {
    return ApiResponse.error({
      message: error?.message || "Gagal memuat profil housekeeping",
      error: error?.message || error,
      status: 404,
    });
  }
}

/**
 * PATCH /api/operations/housekeeping/[id]
 * Update staff details & property assignments
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    if (authUser.role !== UserRole.OWNER && authUser.role !== UserRole.PLATFORM_ADMIN) {
      return ApiResponse.forbidden("Hanya owner atau admin yang memiliki wewenang mengedit data staf.");
    }

    const isPlatformAdmin = authUser.role === UserRole.PLATFORM_ADMIN;
    const ownerId = authUser.id;

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const validation = updateHousekeepingSchema.safeParse(body);
    if (!validation.success) {
      return ApiResponse.badRequest(
        "Validasi input gagal",
        validation.error.flatten().fieldErrors
      );
    }

    const updated = await HousekeepingService.updateHousekeeping(
      ownerId,
      id,
      validation.data,
      isPlatformAdmin
    );

    return ApiResponse.success({
      message: "Data housekeeping berhasil diperbarui",
      data: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/operations/housekeeping/[id] error:", error);
    return ApiResponse.error({
      message: error?.message || "Gagal memperbarui staf housekeeping",
      error: error?.message || error,
      status: 400,
    });
  }
}

/**
 * DELETE /api/operations/housekeeping/[id]
 * Deactivate housekeeping staff
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    if (authUser.role !== UserRole.OWNER && authUser.role !== UserRole.PLATFORM_ADMIN) {
      return ApiResponse.forbidden("Hanya owner atau admin yang memiliki wewenang menonaktifkan staf.");
    }

    const isPlatformAdmin = authUser.role === UserRole.PLATFORM_ADMIN;
    const ownerId = authUser.id;

    const { id } = await context.params;
    const deactivated = await HousekeepingService.toggleStaffStatus(
      ownerId,
      id,
      false,
      isPlatformAdmin
    );

    return ApiResponse.success({
      message: "Akun housekeeping berhasil dinonaktifkan",
      data: deactivated,
    });
  } catch (error: any) {
    console.error("DELETE /api/operations/housekeeping/[id] error:", error);
    return ApiResponse.error({
      message: error?.message || "Gagal menonaktifkan staf housekeeping",
      error: error?.message || error,
      status: 400,
    });
  }
}
