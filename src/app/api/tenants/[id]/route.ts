import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { TenantService } from "@/services/tenant.service";
import { updateTenantSchema } from "@/lib/validations/tenant.schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tenants/[id]
 * Fetch detail tenant profile by ID or User ID.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenant = await TenantService.getTenantById(id);

    if (!tenant) {
      return ApiResponse.notFound("Data penyewa tidak ditemukan");
    }

    return ApiResponse.success({
      message: "Detail penyewa berhasil diambil",
      data: tenant,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal mengambil detail penyewa",
      error,
    });
  }
}

/**
 * PUT /api/tenants/[id]
 * Update tenant profile details.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validationResult = updateTenantSchema.safeParse(body);
    if (!validationResult.success) {
      return ApiResponse.badRequest(
        "Validasi pembaruan data penyewa gagal",
        validationResult.error.flatten().fieldErrors
      );
    }

    const updatedTenant = await TenantService.updateTenant(id, validationResult.data);

    return ApiResponse.success({
      message: "Data penyewa berhasil diperbarui",
      data: updatedTenant,
    });
  } catch (error: any) {
    return ApiResponse.error({
      message: error.message || "Gagal memperbarui data penyewa",
      error,
      status: 400,
    });
  }
}

/**
 * DELETE /api/tenants/[id]
 * Delete tenant profile and user account.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await TenantService.deleteTenant(id);

    return ApiResponse.success({
      message: "Data penyewa berhasil dihapus",
    });
  } catch (error: any) {
    return ApiResponse.error({
      message: error.message || "Gagal menghapus data penyewa",
      error,
      status: 400,
    });
  }
}
