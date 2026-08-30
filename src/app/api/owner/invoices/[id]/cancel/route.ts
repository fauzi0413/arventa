import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

export const dynamic = "force-dynamic";

/**
 * POST /api/owner/invoices/[id]/cancel
 * Cancels a PENDING/PENDING_VERIFICATION SaaS Invoice, records cancellation reason in AuditLog,
 * and restores the original items back into the owner's SaaSCart.
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
    const body = await req.json().catch(() => ({}));
    const { reasonOption, reasonDetails } = body;

    // 1. Fetch Invoice
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

    if (invoice.status === "PAID") {
      return ApiResponse.badRequest("Invoice yang sudah LUNAS tidak dapat dibatalkan.");
    }

    if (invoice.status === "CANCELLED") {
      return ApiResponse.badRequest("Invoice tagihan ini sudah dibatalkan sebelumnya.");
    }

    // 2. Mark Invoice as CANCELLED in DB
    const updatedInvoice = await prisma.saaSInvoice.update({
      where: { id: invoiceId },
      data: {
        status: "CANCELLED",
      },
    });

    // 3. Write Audit Log
    let formattedReason = "";
    if (reasonOption === "Alasan lainnya") {
      formattedReason = reasonDetails?.trim() ? reasonDetails.trim() : "Alasan lainnya";
    } else if (reasonOption) {
      formattedReason = reasonDetails?.trim()
        ? `${reasonOption} (${reasonDetails.trim()})`
        : reasonOption;
    } else {
      formattedReason = "Dibatalkan oleh owner";
    }

    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        action: "CANCEL_SAAS_INVOICE_BY_OWNER",
        entityName: "SaaSInvoice",
        entityId: invoiceId,
        details: {
          invoiceNumber: invoice.invoiceNumber,
          amount: Number(invoice.amount),
          reason: formattedReason,
        },
        ipAddress: "127.0.0.1",
      },
    });

    // 4. RESTORE CART: Find plan and add-ons from invoice items and populate SaaSCart
    let restoredPlanId: string | null = null;
    const restoredAddOnIds: string[] = [];

    const allPlans = await prisma.saaSPlan.findMany({ where: { status: "ACTIVE" } });
    const allAddOns = await prisma.saaSAddOn.findMany({ where: { status: "ACTIVE" } });

    for (const item of invoice.items) {
      if (item.itemType === "PLAN") {
        const matched = allPlans.find((p) =>
          item.itemTitle.toLowerCase().includes(p.name.toLowerCase())
        );
        if (matched) restoredPlanId = matched.id;
      } else if (item.itemType === "ADD_ON") {
        const matched = allAddOns.find((a) =>
          item.itemTitle.toLowerCase().includes(a.name.toLowerCase())
        );
        if (matched) restoredAddOnIds.push(matched.id);
      }
    }

    // Upsert Owner's SaaSCart
    let cart = await prisma.saaSCart.findUnique({ where: { ownerId: authUser.id } });
    if (!cart) {
      cart = await prisma.saaSCart.create({
        data: { ownerId: authUser.id, selectedPlanId: restoredPlanId },
      });
    } else {
      await prisma.saaSCart.update({
        where: { id: cart.id },
        data: { selectedPlanId: restoredPlanId },
      });
    }

    // Re-create cart items
    await prisma.saaSCartItem.deleteMany({ where: { cartId: cart.id } });
    if (restoredAddOnIds.length > 0) {
      await prisma.saaSCartItem.createMany({
        data: restoredAddOnIds.map((addOnId) => ({
          cartId: cart.id,
          addOnId,
          quantity: 1,
        })),
      });
    }

    return ApiResponse.success({
      message: `Invoice tagihan ${invoice.invoiceNumber} berhasil dibatalkan. Item pesanan telah dikembalikan ke Keranjang Belanja Anda.`,
      data: {
        invoice: updatedInvoice,
        restoredPlanId,
        restoredAddOnIds,
      },
    });
  } catch (error: any) {
    console.error("POST /api/owner/invoices/[id]/cancel error:", error);
    return ApiResponse.error({
      message: "Gagal membatalkan invoice tagihan SaaS",
      error: error?.message || error,
      status: 500,
    });
  }
}
