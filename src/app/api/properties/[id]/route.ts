import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { PropertyService } from "@/services/property.service";
import { updatePropertySchema } from "@/lib/validations/property.schema";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/properties/[id]
 * Fetch single property detail with its units and details.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const property = await PropertyService.getPropertyById(id);
    if (!property) {
      return ApiResponse.notFound(`Property with ID '${id}' not found`);
    }

    return ApiResponse.success({
      message: "Property details retrieved successfully",
      data: property,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Failed to retrieve property details",
      error,
    });
  }
}

/**
 * PATCH /api/properties/[id]
 * Update existing property record.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingProperty = await PropertyService.getPropertyById(id);
    if (!existingProperty) {
      return ApiResponse.notFound(`Property with ID '${id}' not found`);
    }

    const validationResult = updatePropertySchema.safeParse(body);
    if (!validationResult.success) {
      return ApiResponse.badRequest(
        "Validation failed",
        validationResult.error.flatten().fieldErrors
      );
    }

    const updatedProperty = await PropertyService.updateProperty(
      id,
      validationResult.data
    );

    return ApiResponse.success({
      message: "Property updated successfully",
      data: updatedProperty,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Failed to update property",
      error,
    });
  }
}

/**
 * DELETE /api/properties/[id]
 * Delete a property record by ID.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existingProperty = await PropertyService.getPropertyById(id);
    if (!existingProperty) {
      return ApiResponse.notFound(`Property with ID '${id}' not found`);
    }

    await PropertyService.deleteProperty(id);

    return ApiResponse.success({
      message: "Property deleted successfully",
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Failed to delete property",
      error,
    });
  }
}
