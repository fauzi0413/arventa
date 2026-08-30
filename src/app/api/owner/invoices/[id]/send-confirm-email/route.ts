import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import {
  sendSupportPaymentProofNotificationEmail,
  sendOwnerPaymentConfirmationAckEmail,
} from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * POST /api/owner/invoices/[id]/send-confirm-email
 * Triggers automated confirmation email dispatch from owner's account to support email
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return ApiResponse.unauthorized("Belum terautentikasi");
    }

    const { id: invoiceId } = await params;

    const invoice = await prisma.saaSInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        subscription: true,
        items: true,
      },
    });

    if (!invoice || invoice.subscription.ownerId !== authUser.id) {
      return ApiResponse.notFound("Invoice tagihan SaaS tidak ditemukan");
    }

    const supportEmailSetting = await prisma.systemSetting.findUnique({
      where: { key: "support_email" },
    });
    const supportEmail = supportEmailSetting?.value || "support@arventa.id";

    const itemTitles = invoice.items?.map((i) => i.itemTitle).join(", ") || "Lisensi SaaS";
    const formattedAmount = `Rp ${Number(invoice.amount).toLocaleString("id-ID")}`;
    const ownerName = authUser.fullName || authUser.email || "Owner";
    const ownerEmail = authUser.email || "";

    // 1. Dispatch Email to Support CS
    const supportSent = await sendSupportPaymentProofNotificationEmail({
      supportEmail,
      ownerName,
      ownerEmail,
      invoiceNumber: invoice.invoiceNumber,
      amountPaid: formattedAmount,
      itemSummary: itemTitles,
    });

    // 2. Dispatch Confirmation Ack Email to Owner
    if (ownerEmail) {
      await sendOwnerPaymentConfirmationAckEmail({
        ownerEmail,
        ownerName,
        invoiceNumber: invoice.invoiceNumber,
        amountPaid: formattedAmount,
        itemSummary: itemTitles,
      }).catch((err) => console.error("Owner Ack Email error:", err));
    }

    return ApiResponse.success({
      message: `Konfirmasi pembayaran berhasil dikirimkan dari email Anda (${ownerEmail}) ke Tim Support (${supportEmail})! Mohon menunggu proses verifikasi mutasi dan aktivasi lisensi Anda.`,
      data: {
        supportEmail,
        ownerEmail,
        supportSent,
      },
    });
  } catch (error: any) {
    console.error("POST /api/owner/invoices/[id]/send-confirm-email error:", error);
    return ApiResponse.error({
      message: "Gagal mengirimkan email konfirmasi pembayaran",
      error: error?.message || error,
      status: 500,
    });
  }
}
