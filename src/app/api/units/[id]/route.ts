import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { UnitService } from "@/services/unit.service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/units/[id]
 * Retrieve single unit details with active lease and room credentials
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const unit = await UnitService.getUnitById(id);

    if (!unit) {
      return ApiResponse.notFound(`Unit with ID '${id}' not found`);
    }

    return ApiResponse.success({
      message: "Unit details retrieved successfully",
      data: unit,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Failed to retrieve unit details",
      error,
    });
  }
}

/**
 * PATCH /api/units/[id]
 * Update unit details
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await UnitService.getUnitById(id);
    if (!existing) {
      return ApiResponse.notFound(`Unit with ID '${id}' not found`);
    }

    const updated = await UnitService.updateUnit(id, {
      name: body.name,
      floor: body.floor !== undefined ? Number(body.floor) : undefined,
      status: body.status,
      allowedPeriod: body.allowedPeriod,
      basePrice: body.basePrice !== undefined ? Number(body.basePrice) : undefined,
      transitPrice: body.transitPrice !== undefined ? Number(body.transitPrice) : undefined,
      deposit: body.deposit !== undefined ? Number(body.deposit) : undefined,
      capacity: body.capacity !== undefined ? Number(body.capacity) : undefined,
      dimensions: body.dimensions,
      facilities: body.facilities,
      description: body.description,
      imageUrl: body.imageUrl,
    });

    return ApiResponse.success({
      message: "Unit updated successfully",
      data: updated,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Failed to update unit",
      error,
    });
  }
}

/**
 * DELETE /api/units/[id]
 * Delete unit and clean up associated room user account
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await UnitService.getUnitById(id);
    if (!existing) {
      return ApiResponse.notFound(`Unit with ID '${id}' not found`);
    }

    await UnitService.deleteUnit(id);

    return ApiResponse.success({
      message: "Unit and room account deleted successfully",
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Failed to delete unit",
      error,
    });
  }
}
