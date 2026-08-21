import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { UnitService } from "@/services/unit.service";
import { UnitStatus } from "@/generated/prisma/client";

/**
 * GET /api/units
 * Retrieve units list with filters (propertyId, status, search)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId") || undefined;
    const status = (searchParams.get("status") as UnitStatus) || undefined;
    const search = searchParams.get("search") || undefined;

    const units = await UnitService.getAllUnits({
      propertyId,
      status,
      search,
    });

    return ApiResponse.success({
      message: "Units retrieved successfully",
      data: units,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Failed to retrieve units",
      error,
    });
  }
}

/**
 * POST /api/units
 * Create a single unit or batch units (auto-creates room user account & active lease if tenant info is provided)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if batch creation
    if (body.batch && Array.isArray(body.units) && body.propertyId) {
      const created = await UnitService.createBatchUnits(body.propertyId, body.units);
      return ApiResponse.success({
        message: `${created.length} units created successfully`,
        data: created,
        status: 201,
      });
    }

    // Single unit creation
    if (!body.propertyId || !body.name || body.basePrice === undefined) {
      return ApiResponse.badRequest("propertyId, name, and basePrice are required.");
    }

    const created = await UnitService.createUnit({
      propertyId: body.propertyId,
      name: body.name,
      floor: body.floor ? Number(body.floor) : 1,
      status: body.status,
      allowedPeriod: body.allowedPeriod,
      basePrice: Number(body.basePrice),
      transitPrice: body.transitPrice ? Number(body.transitPrice) : undefined,
      deposit: body.deposit ? Number(body.deposit) : 0,
      capacity: body.capacity ? Number(body.capacity) : 1,
      dimensions: body.dimensions,
      facilities: body.facilities,
      description: body.description,
      imageUrl: body.imageUrl,
      tenantName: body.tenantName,
      tenantPhone: body.tenantPhone,
      checkInDate: body.checkInDate,
    });

    return ApiResponse.success({
      message: "Unit created successfully with dedicated room account",
      data: created,
      status: 201,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Failed to create unit",
      error,
    });
  }
}
