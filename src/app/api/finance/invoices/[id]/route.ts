import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { prisma } from "@/lib/prisma";
import { InvoiceService } from "@/services/invoice.service";
import { updateInvoiceSchema } from "@/lib/validations/invoice.schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
    if (propertyIds.length === 0) hasAccess = false;
  } else if (authUser.role === UserRole.HOUSEKEEPING) {
    const assignments = await prisma.housekeepingAssignment.findMany({
      where: { userId: authUser.id },
      select: { propertyId: true },
    });
    propertyIds = assignments.map((a) => a.propertyId);
    if (propertyIds.length === 0) hasAccess = false;
  } else if (authUser.role === UserRole.TENANT || authUser.role === UserRole.USER) {
    tenantUserId = authUser.id;
  }

  return { ownerId, propertyIds, tenantUserId, hasAccess };
}

/**
 * GET /api/finance/invoices/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required");
    }

    const { ownerId, propertyIds, tenantUserId, hasAccess } = await resolveUserAccessScope(authUser);
    if (!hasAccess) {
      return ApiResponse.forbidden("Anda tidak memiliki akses ke invoice ini.");
    }

    const invoice = await InvoiceService.getInvoiceById(id, ownerId, propertyIds, tenantUserId);

    return ApiResponse.success({
      message: "Invoice retrieved successfully",
      data: invoice,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Failed to retrieve invoice details",
      error,
    });
  }
}

/**
 * PATCH /api/finance/invoices/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required");
    }

    const { ownerId, propertyIds, hasAccess } = await resolveUserAccessScope(authUser);
    if (!hasAccess) {
      return ApiResponse.forbidden("Anda tidak memiliki akses untuk mengubah invoice ini.");
    }

    const body = await request.json();
    const validatedData = updateInvoiceSchema.parse(body);

    const updated = await InvoiceService.updateInvoice(id, ownerId, validatedData, propertyIds);

    return ApiResponse.success({
      message: "Invoice berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal memperbarui data invoice",
      error,
    });
  }
}

/**
 * DELETE /api/finance/invoices/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required");
    }

    const { ownerId, propertyIds, hasAccess } = await resolveUserAccessScope(authUser);
    if (!hasAccess) {
      return ApiResponse.forbidden("Anda tidak memiliki akses untuk menghapus invoice ini.");
    }

    await InvoiceService.deleteInvoice(id, ownerId, propertyIds);

    return ApiResponse.success({
      message: "Invoice berhasil dihapus",
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal menghapus invoice",
      error,
    });
  }
}
