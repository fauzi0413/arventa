import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { prisma } from "@/lib/prisma";
import { InvoiceService } from "@/services/invoice.service";
import { createInvoiceSchema, invoiceFilterSchema } from "@/lib/validations/invoice.schema";

/**
 * Helper to resolve property scoping and user permissions strictly based on logged-in user & role
 */
async function resolveUserAccessScope(authUser: any) {
  let ownerId: string | undefined = undefined;
  let propertyIds: string[] | undefined = undefined;
  let tenantUserId: string | undefined = undefined;
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
  } else if (authUser.role === UserRole.TENANT || authUser.role === UserRole.USER) {
    tenantUserId = authUser.id;
  }

  return { ownerId, propertyIds, tenantUserId, hasAccess };
}

/**
 * GET /api/finance/invoices
 * Fetch paginated & filtered list of invoices strictly scoped to user's assigned/owned properties.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required to access finance invoices");
    }

    const { ownerId, propertyIds, tenantUserId, hasAccess } = await resolveUserAccessScope(authUser);

    // Empty state if user has no assigned/owned properties
    if (!hasAccess) {
      return ApiResponse.success({
        message: "Invoices retrieved successfully",
        data: [],
        meta: {
          page: 1,
          limit: 10,
          totalCount: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
          stats: {
            totalAmount: 0,
            totalCount: 0,
            paidAmount: 0,
            paidCount: 0,
            pendingAmount: 0,
            pendingCount: 0,
            overdueAmount: 0,
            overdueCount: 0,
          },
        },
      });
    }

    const { searchParams } = new URL(request.url);

    // If request asks for active leases dropdown list
    if (searchParams.get("includeLeases") === "true" || searchParams.get("leasesOnly") === "true") {
      const propertyId = searchParams.get("propertyId") || undefined;
      const leases = await InvoiceService.getActiveLeasesForOwner(ownerId, propertyId, propertyIds, tenantUserId);
      return ApiResponse.success({
        message: "Active leases retrieved successfully",
        data: leases,
      });
    }

    const filterInput = invoiceFilterSchema.parse({
      propertyId: searchParams.get("propertyId") || undefined,
      unitId: searchParams.get("unitId") || undefined,
      status: searchParams.get("status") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
    });

    const result = await InvoiceService.getInvoicesForOwner(ownerId, filterInput, propertyIds, tenantUserId);

    return ApiResponse.success({
      message: "Invoices retrieved successfully",
      data: result.items,
      meta: {
        ...result.meta,
        stats: result.stats,
      },
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Failed to retrieve invoices",
      error,
    });
  }
}

/**
 * POST /api/finance/invoices
 * Create a new invoice for a tenant lease
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required to create invoice");
    }

    const { ownerId, propertyIds, hasAccess } = await resolveUserAccessScope(authUser);
    if (!hasAccess) {
      return ApiResponse.forbidden("Anda tidak memiliki akses ke properti manapun untuk membuat invoice.");
    }

    const body = await request.json();
    const validatedData = createInvoiceSchema.parse(body);

    const invoice = await InvoiceService.createInvoice(ownerId || null, validatedData, propertyIds);

    return ApiResponse.success({
      message: "Invoice tagihan baru berhasil dibuat",
      data: invoice,
      status: 201,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal membuat invoice tagihan baru",
      error,
    });
  }
}
