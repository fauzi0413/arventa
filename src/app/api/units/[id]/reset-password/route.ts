import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { UnitService } from "@/services/unit.service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/units/[id]/reset-password
 * Reset room account password (available to Owner & Housekeeping)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await UnitService.getUnitById(id);
    if (!existing) {
      return ApiResponse.notFound(`Unit with ID '${id}' not found`);
    }

    const result = await UnitService.resetRoomPassword(id);

    return ApiResponse.success({
      message: "Password akun kamar berhasil di-reset",
      data: result,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal mereset password akun kamar",
      error,
    });
  }
}
