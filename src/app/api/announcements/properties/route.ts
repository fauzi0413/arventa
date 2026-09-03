import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";

/**
 * GET /api/announcements/properties
 * Returns properties and units accessible to current user based on RBAC.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    }

    let propertiesQuery: any = {};

    if (authUser.role === UserRole.PLATFORM_ADMIN) {
      // Platform Admin can see all properties
      propertiesQuery = {};
    } else if (authUser.role === UserRole.OWNER) {
      // Owner only sees their properties
      propertiesQuery = {
        ownerId: authUser.id,
      };
    } else if (authUser.role === UserRole.HOUSEKEEPING) {
      // Housekeeping only sees assigned properties
      propertiesQuery = {
        housekeepingAssignments: {
          some: {
            userId: authUser.id,
          },
        },
      };
    } else if (authUser.role === UserRole.TENANT || authUser.role === UserRole.USER) {
      // Tenant: find unit where user is assigned or active lease exists
      const activeLease = await prisma.lease.findFirst({
        where: {
          status: "ACTIVE",
          OR: [
            { tenant: { userId: authUser.id } },
            { tenant: { email: authUser.email } },
            { unit: { unitUserId: authUser.id } },
          ],
        },
        select: {
          unit: {
            select: {
              propertyId: true,
            },
          },
        },
      });

      if (!activeLease) {
        return ApiResponse.success({ data: [] });
      }

      propertiesQuery = {
        id: activeLease.unit.propertyId,
      };
    }

    const properties = await prisma.property.findMany({
      where: propertiesQuery,
      select: {
        id: true,
        name: true,
        address: true,
        type: true,
        units: {
          select: {
            id: true,
            unitNumber: true,
            floor: true,
            status: true,
          },
          orderBy: [{ floor: "asc" }, { unitNumber: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    });

    return ApiResponse.success({
      message: "Daftar properti dan unit berhasil dimuat",
      data: properties,
    });
  } catch (error: any) {
    console.error("Error fetching announcement properties:", error);
    return ApiResponse.error({
      message: "Gagal memuat daftar properti untuk pengumuman",
      error: error?.message,
    });
  }
}
