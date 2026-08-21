import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { UnitService } from "@/services/unit.service";

/**
 * POST /api/units/bulk
 * Perform bulk operations (status update, facilities update, pricing update, bulk delete)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.unitIds || !Array.isArray(body.unitIds) || body.unitIds.length === 0) {
      return ApiResponse.badRequest("Daftar unitIds wajib disertakan.");
    }

    if (!body.actionType) {
      return ApiResponse.badRequest("actionType wajib disertakan.");
    }

    const result = await UnitService.bulkAction({
      unitIds: body.unitIds,
      actionType: body.actionType,
      newStatus: body.newStatus,
      facilityOperation: body.facilityOperation,
      facilitiesToApply: body.facilitiesToApply,
      priceAdjustmentType: body.priceAdjustmentType,
      priceValue: body.priceValue !== undefined ? Number(body.priceValue) : undefined,
    });

    return ApiResponse.success({
      message: "Aksi massal unit berhasil dijalankan",
      data: result,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal memproses aksi massal unit",
      error,
    });
  }
}
