import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/finance/payment-methods/[id]
 * Edit or toggle active status of Owner payment method
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required");
    }

    let targetOwnerId = authUser.id;
    if (targetOwnerId === "demo-user-id") {
      const ownerUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: authUser.email },
            { role: UserRole.OWNER },
          ],
        },
        select: { id: true },
      });
      if (ownerUser) {
        targetOwnerId = ownerUser.id;
      }
    }

    const { id } = await params;
    const existing = await prisma.ownerPaymentMethod.findFirst({
      where: { id, ownerId: targetOwnerId },
    });

    if (!existing) {
      return ApiResponse.notFound("Rekening bank tidak ditemukan atau Anda tidak memiliki akses.");
    }

    const body = await request.json();
    const { bankName, accountNumber, accountHolder, notes, isEnabled, propertyId } = body;

    const updated = await prisma.ownerPaymentMethod.update({
      where: { id },
      data: {
        bankName: bankName !== undefined ? bankName.trim() : existing.bankName,
        accountNumber: accountNumber !== undefined ? accountNumber.trim() : existing.accountNumber,
        accountHolder: accountHolder !== undefined ? accountHolder.trim() : existing.accountHolder,
        notes: notes !== undefined ? notes?.trim() : existing.notes,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : existing.isEnabled,
        propertyId: propertyId !== undefined ? (propertyId && propertyId !== "ALL" ? propertyId : null) : existing.propertyId,
      },
      include: {
        property: {
          select: { id: true, name: true },
        },
      },
    });

    return ApiResponse.success({
      message: "Rekening bank berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal memperbarui rekening bank",
      error,
    });
  }
}

/**
 * DELETE /api/finance/payment-methods/[id]
 * Delete an Owner payment method
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required");
    }

    let targetOwnerId = authUser.id;
    if (targetOwnerId === "demo-user-id") {
      const ownerUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: authUser.email },
            { role: UserRole.OWNER },
          ],
        },
        select: { id: true },
      });
      if (ownerUser) {
        targetOwnerId = ownerUser.id;
      }
    }

    const { id } = await params;
    const existing = await prisma.ownerPaymentMethod.findFirst({
      where: { id, ownerId: targetOwnerId },
    });

    if (!existing) {
      return ApiResponse.notFound("Rekening bank tidak ditemukan atau Anda tidak memiliki akses.");
    }

    await prisma.ownerPaymentMethod.delete({
      where: { id },
    });

    return ApiResponse.success({
      message: "Rekening bank berhasil dihapus",
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal menghapus rekening bank",
      error,
    });
  }
}
