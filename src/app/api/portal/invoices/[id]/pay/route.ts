import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@/generated/prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required");
    }

    const { id } = await params;
    const body = await request.json();
    const { paymentReceipt } = body;

    if (!paymentReceipt) {
      return ApiResponse.badRequest("Bukti transfer pembayaran (paymentReceipt) wajib disertakan.");
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id },
      include: {
        lease: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!invoice) {
      return ApiResponse.notFound("Invoice tidak ditemukan.");
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        paymentReceipt,
        status: InvoiceStatus.PENDING_VERIFICATION,
      },
      include: {
        lease: {
          include: {
            unit: { include: { property: true } },
          },
        },
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        action: "TENANT_PAYMENT_PROOF_SUBMITTED",
        entityName: "Invoice",
        entityId: id,
        details: {
          invoiceNumber: invoice.invoiceNumber,
          paymentReceipt,
          status: InvoiceStatus.PENDING_VERIFICATION,
        },
      },
    });

    return ApiResponse.success({
      message: "Bukti pembayaran berhasil diunggah. Menunggu verifikasi pengelola.",
      data: updated,
    });
  } catch (error: any) {
    return ApiResponse.error({
      message: "Gagal mengunggah bukti pembayaran invoice.",
      error,
    });
  }
}
