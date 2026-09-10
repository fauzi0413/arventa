import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/finance/payment-methods
 * Fetch payment methods configured by logged-in Owner
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required");
    }

    if (authUser.role !== UserRole.OWNER && authUser.role !== UserRole.PLATFORM_ADMIN) {
      return ApiResponse.forbidden("Hanya Owner properti yang dapat mengelola rekening bank.");
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

    const paymentMethods = await prisma.ownerPaymentMethod.findMany({
      where: { ownerId: targetOwnerId },
      include: {
        property: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return ApiResponse.success({
      message: "Rekening bank berhasil dimuat",
      data: paymentMethods,
    });
  } catch (error) {
    console.error("GET /api/finance/payment-methods error:", error);
    return ApiResponse.error({
      message: "Gagal memuat daftar rekening bank",
      error,
    });
  }
}

/**
 * POST /api/finance/payment-methods
 * Add a new Owner payment method / bank account
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required");
    }

    if (authUser.role !== UserRole.OWNER && authUser.role !== UserRole.PLATFORM_ADMIN) {
      return ApiResponse.forbidden("Hanya Owner properti yang dapat menambahkan rekening bank.");
    }

    const body = await request.json();
    const { bankName, accountNumber, accountHolder, notes, propertyId } = body;

    if (!bankName || !accountNumber || !accountHolder) {
      return ApiResponse.badRequest("Nama Bank, Nomor Rekening, dan Nama Pemilik Rekening wajib diisi.");
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

    const paymentMethod = await prisma.ownerPaymentMethod.create({
      data: {
        ownerId: targetOwnerId,
        propertyId: propertyId && propertyId !== "ALL" ? propertyId : null,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
        notes: notes ? notes.trim() : null,
        isEnabled: true,
      },
      include: {
        property: {
          select: { id: true, name: true },
        },
      },
    });

    return ApiResponse.success({
      message: "Rekening bank baru berhasil ditambahkan",
      data: paymentMethod,
      status: 201,
    });
  } catch (error: any) {
    console.error("POST /api/finance/payment-methods error:", error);
    return ApiResponse.error({
      message: error?.message || "Gagal menambahkan rekening bank baru",
      error,
    });
  }
}
