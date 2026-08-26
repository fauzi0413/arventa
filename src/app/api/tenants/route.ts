import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { TenantService } from "@/services/tenant.service";
import { createTenantSchema } from "@/lib/validations/tenant.schema";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/tenants
 * Fetch paginated & filtered list of tenants scoped to logged-in user.
 * Query Params: ?search=...&page=1&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10;

    const authUser = await getAuthenticatedUser(request);
    let propertyIds: string[] | undefined = undefined;
    let userIdFilter: string | undefined = undefined;

    if (authUser) {
      if (authUser.role === UserRole.OWNER) {
        const ownerProps = await prisma.property.findMany({
          where: { ownerId: authUser.id },
          select: { id: true },
        });
        propertyIds = ownerProps.map((p) => p.id);
      } else if (authUser.role === UserRole.HOUSEKEEPING) {
        const assignments = await prisma.housekeepingAssignment.findMany({
          where: { userId: authUser.id },
          select: { propertyId: true },
        });
        propertyIds = assignments.map((a) => a.propertyId);
      } else if (authUser.role === UserRole.USER) {
        userIdFilter = authUser.id;
      }
    }

    const result = await TenantService.getAllTenants({
      search,
      propertyIds,
      userId: userIdFilter,
      page,
      limit,
    });

    return ApiResponse.success({
      message: "Daftar penyewa berhasil diambil",
      data: result.items,
      meta: result.meta,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal mengambil data penyewa",
      error,
    });
  }
}

/**
 * POST /api/tenants
 * Create a new tenant user and profile record.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request payload with Zod
    const validationResult = createTenantSchema.safeParse(body);
    if (!validationResult.success) {
      return ApiResponse.badRequest(
        "Validasi data penyewa gagal",
        validationResult.error.flatten().fieldErrors
      );
    }

    const newTenant = await TenantService.createTenant(validationResult.data);

    return ApiResponse.success({
      message: "Profil penyewa berhasil dibuat",
      data: newTenant,
      status: 201,
    });
  } catch (error: any) {
    return ApiResponse.error({
      message: error.message || "Gagal membuat data penyewa",
      error,
      status: 400,
    });
  }
}
