import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { sendSupportPaymentProofNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * POST /api/owner/invoices/[id]/upload-proof
 * Uploads payment proof receipt for a SaaS invoice and updates status to PENDING_VERIFICATION
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

    // Find invoice
    const invoice = await prisma.saaSInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        subscription: true,
      },
    });

    if (!invoice || invoice.subscription.ownerId !== authUser.id) {
      return ApiResponse.notFound("Invoice tagihan SaaS tidak ditemukan");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const proofUrlInput = formData.get("proofUrl") as string | null;

    let paymentProofUrl = "";

    if (file) {
      // Convert file to base64 data URL or save locally
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mimeType = file.type || "image/jpeg";
      paymentProofUrl = `data:${mimeType};base64,${base64}`;
    } else if (proofUrlInput) {
      paymentProofUrl = proofUrlInput;
    } else {
      return ApiResponse.badRequest("File bukti transfer pembayaran wajib diunggah.");
    }

    // Update invoice record in PostgreSQL
    const updatedInvoice = await prisma.saaSInvoice.update({
      where: { id: invoiceId },
      data: {
        paymentProof: paymentProofUrl,
        status: "PENDING_VERIFICATION",
      },
      include: {
        items: true,
      },
    });

    // Dispatch Email Notification to Support Email asynchronously
    try {
      const supportEmailSetting = await prisma.systemSetting.findUnique({
        where: { key: "support_email" },
      });
      const supportEmail = supportEmailSetting?.value || "support@arventa.id";

      const itemTitles = updatedInvoice.items?.map((i) => i.itemTitle).join(", ") || "Lisensi SaaS";
      const formattedAmount = `Rp ${Number(updatedInvoice.amount).toLocaleString("id-ID")}`;

      sendSupportPaymentProofNotificationEmail({
        supportEmail,
        ownerName: authUser.fullName || authUser.email || "Owner",
        ownerEmail: authUser.email || "-",
        invoiceNumber: updatedInvoice.invoiceNumber,
        amountPaid: formattedAmount,
        itemSummary: itemTitles,
      }).catch((err) => console.error("Email notification dispatch error:", err));
    } catch (err) {
      console.error("Failed to fetch support email setting:", err);
    }

    return ApiResponse.success({
      message: "Bukti transfer pembayaran berhasil diunggah! Status tagihan kini Menunggu Verifikasi Admin.",
      data: updatedInvoice,
    });
  } catch (error: any) {
    console.error("POST /api/owner/invoices/[id]/upload-proof error:", error);
    return ApiResponse.error({
      message: "Gagal mengunggah bukti transfer pembayaran",
      error: error?.message || error,
      status: 500,
    });
  }
}
