import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { prisma } from "@/lib/prisma";
import { ReportService } from "@/services/report.service";

/**
 * Helper to resolve property scoping based on logged-in user & role
 */
async function resolveUserAccessScope(authUser: any) {
  let ownerId: string | undefined = undefined;
  let propertyIds: string[] | undefined = undefined;
  let hasAccess = true;

  if (authUser.role === UserRole.OWNER) {
    const ownedProperties = await prisma.property.findMany({
      where: { ownerId: authUser.id },
      select: { id: true },
    });
    ownerId = authUser.id;
    propertyIds = ownedProperties.map((p) => p.id);
    if (propertyIds.length === 0) {
      hasAccess = false;
    }
  } else if (authUser.role === UserRole.HOUSEKEEPING) {
    const assignments = await prisma.housekeepingAssignment.findMany({
      where: { userId: authUser.id },
      select: { propertyId: true },
    });
    propertyIds = assignments.map((a) => a.propertyId);
    if (propertyIds.length === 0) {
      hasAccess = false;
    }
  }

  return { ownerId, propertyIds, hasAccess };
}

/**
 * GET /api/reports
 * Query params: type = 'financial' | 'occupancy' | 'tenant' | 'operational'
 * Filters: propertyId, startDate, endDate
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required to view reports");
    }

    const { ownerId, propertyIds, hasAccess } = await resolveUserAccessScope(authUser);

    if (!hasAccess) {
      return ApiResponse.success({
        message: "Reports retrieved successfully",
        data: {
          type: "none",
          summary: {},
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "financial";
    const propertyId = searchParams.get("propertyId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const filters = { propertyId, startDate, endDate };

    let reportData: any = {};

    switch (reportType) {
      case "occupancy":
        reportData = await ReportService.getOccupancyReport(ownerId, filters, propertyIds);
        break;
      case "tenant":
        reportData = await ReportService.getTenantReport(ownerId, filters, propertyIds);
        break;
      case "operational":
        reportData = await ReportService.getOperationalReport(ownerId, filters, propertyIds);
        break;
      case "financial":
      default:
        reportData = await ReportService.getFinancialReport(ownerId, filters, propertyIds);
        break;
    }

    return ApiResponse.success({
      message: `${reportType} report generated successfully`,
      data: {
        type: reportType,
        ...reportData,
      },
    });
  } catch (error: any) {
    console.error("GET /api/reports error:", error);
    return ApiResponse.error({
      message: "Failed to generate report: " + (error.message || "Unknown error"),
      status: 500,
    });
  }
}
