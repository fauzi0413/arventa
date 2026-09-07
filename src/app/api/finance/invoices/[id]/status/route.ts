import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { prisma } from "@/lib/prisma";
import { InvoiceService } from "@/services/invoice.service";
import { updateInvoiceStatusSchema } from "@/lib/validations/invoice.schema";

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
 * PATCH /api/finance/invoices/[id]/status
 * Fast status change endpoint for Owner
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
      return ApiResponse.forbidden("Anda tidak memiliki akses untuk mengubah status invoice ini.");
    }

    const body = await request.json();
    const validatedData = updateInvoiceStatusSchema.parse(body);

    const updated = await InvoiceService.updateInvoiceStatus(
      id,
      ownerId,
      validatedData.status,
      validatedData.paymentReceipt,
      validatedData.paidAt,
      propertyIds
    );

    return ApiResponse.success({
      message: `Status invoice berhasil diubah menjadi ${validatedData.status}`,
      data: updated,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal memperbarui status invoice",
      error,
    });
  }
}
