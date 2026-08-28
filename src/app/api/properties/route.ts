import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { PropertyService } from "@/services/property.service";
import { createPropertySchema } from "@/lib/validations/property.schema";
import { PropertyType } from "@/generated/prisma/client";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/properties
 * Fetch paginated & filtered list of properties scoped to current user.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || undefined;
    const type = (searchParams.get("type") as PropertyType) || undefined;
    const city = searchParams.get("city") || undefined;
    let ownerId = searchParams.get("ownerId") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10;

    const authUser = await getAuthenticatedUser(request);
    let propertyIds: string[] | undefined = undefined;

    if (authUser) {
      if (authUser.role === UserRole.OWNER) {
        ownerId = authUser.id;
      } else if (authUser.role === UserRole.HOUSEKEEPING) {
        const assignments = await prisma.housekeepingAssignment.findMany({
          where: { userId: authUser.id },
          select: { propertyId: true },
        });
        propertyIds = assignments.map((a) => a.propertyId);
      } else if (authUser.role === UserRole.USER || authUser.role === UserRole.TENANT) {
        const tenantUnits = await prisma.unit.findMany({
          where: {
            OR: [
              { unitUserId: authUser.id },
              { leases: { some: { tenant: { userId: authUser.id } } } },
            ],
          },
          select: { propertyId: true },
        });
        propertyIds = tenantUnits.map((u) => u.propertyId);
      }
    }

    const result = await PropertyService.getAllProperties({
      search,
      type,
      city,
      ownerId,
      propertyIds,
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
 * Create a new property record for logged-in owner.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authUser = await getAuthenticatedUser(request);

    let ownerId = authUser?.id;

    if (!ownerId || body.ownerId === "demo-user-id" || body.ownerId === "owner-head-1" || !body.ownerId) {
      if (authUser && (authUser.role === UserRole.OWNER || authUser.role === UserRole.PLATFORM_ADMIN)) {
        ownerId = authUser.id;
      } else {
        const firstOwner = await prisma.user.findFirst({
          where: { role: UserRole.OWNER },
          select: { id: true },
        });
        ownerId = firstOwner?.id || authUser?.id;
      }
    }

    if (!ownerId) {
      const anyUser = await prisma.user.findFirst({ select: { id: true } });
      ownerId = anyUser?.id;
    }

    body.ownerId = ownerId;

    // Validate request payload with Zod
    const validationResult = createPropertySchema.safeParse(body);
    if (!validationResult.success) {
      return ApiResponse.badRequest(
        "Validasi data properti gagal",
        validationResult.error.flatten().fieldErrors
      );
    }

    const newProperty = await PropertyService.createProperty(validationResult.data as any);

    return ApiResponse.success({
      message: `Properti '${newProperty.name}' berhasil ditambahkan ke database`,
      data: newProperty,
      status: 201,
    });
  } catch (error: any) {
    console.error("POST /api/properties error:", error);
    return ApiResponse.error({
      message: error?.message || "Gagal membuat properti di database",
      error: error?.message || error,
      status: 500,
    });
  }
}
