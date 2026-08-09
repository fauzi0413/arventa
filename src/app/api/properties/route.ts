import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { PropertyService } from "@/services/property.service";
import { createPropertySchema } from "@/lib/validations/property.schema";
import { PropertyType } from "@/generated/prisma/client";

/**
 * GET /api/properties
 * Fetch paginated & filtered list of properties.
 * Query Params: ?search=...&type=KOS&city=Bandung&ownerId=...&page=1&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || undefined;
    const type = (searchParams.get("type") as PropertyType) || undefined;
    const city = searchParams.get("city") || undefined;
    const ownerId = searchParams.get("ownerId") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10;

    const result = await PropertyService.getAllProperties({
      search,
      type,
      city,
      ownerId,
      page,
      limit,
    });

    return ApiResponse.success({
      message: "Properties retrieved successfully",
      data: result.items,
      meta: result.meta,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Failed to retrieve properties",
      error,
    });
  }
}

/**
 * POST /api/properties
 * Create a new property record.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request payload with Zod
    const validationResult = createPropertySchema.safeParse(body);
    if (!validationResult.success) {
      return ApiResponse.badRequest(
        "Validation failed",
        validationResult.error.flatten().fieldErrors
      );
    }

    const newProperty = await PropertyService.createProperty(validationResult.data);

    return ApiResponse.success({
      message: "Property created successfully",
      data: newProperty,
      status: 201,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Failed to create property",
      error,
    });
  }
}
