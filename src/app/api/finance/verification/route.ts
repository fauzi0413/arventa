import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@/generated/prisma/client";
import { sendPaymentReceiptEmail } from "@/lib/email";

/**
 * Helper to get property IDs owned by the logged in Owner
 */
async function getOwnerPropertyIds(ownerId: string) {
  const properties = await prisma.property.findMany({
    where: { ownerId },
    select: { id: true },
  });
  return properties.map((p) => p.id);
}

/**
 * GET /api/finance/verification
 * Retrieve list of invoices with payment receipts uploaded requiring owner verification
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required");
    }

    if (authUser.role !== UserRole.OWNER && authUser.role !== UserRole.PLATFORM_ADMIN) {
      return ApiResponse.forbidden("Hanya Owner yang dapat mengakses verifikasi invoice.");
    }

    const propertyIds = await getOwnerPropertyIds(authUser.id);
    if (propertyIds.length === 0) {
      return ApiResponse.success({
        message: "No properties found for owner",
        data: [],
        meta: {
          pendingCount: 0,
          paidCount: 0,
          totalCount: 0,
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "ALL";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      lease: {
        unit: {
          propertyId: { in: propertyIds },
        },
      },
    };

    if (statusFilter === "PENDING_VERIFICATION") {
      whereClause.status = InvoiceStatus.PENDING_VERIFICATION;
    } else if (statusFilter === "PAID") {
      whereClause.status = InvoiceStatus.PAID;
    } else if (statusFilter === "WITH_RECEIPT") {
      whereClause.paymentReceipt = { not: null };
    }

    const [invoices, pendingCount, paidCount, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where: whereClause,
        orderBy: { updatedAt: "desc" },
        include: {
          lease: {
            include: {
              unit: {
                include: {
                  property: {
                    select: { id: true, name: true, address: true },
                  },
                },
              },
              tenant: {
                include: {
                  user: {
                    select: { id: true, fullName: true, email: true, phoneNumber: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.invoice.count({
        where: {
          lease: { unit: { propertyId: { in: propertyIds } } },
          status: InvoiceStatus.PENDING_VERIFICATION,
        },
      }),
      prisma.invoice.count({
        where: {
          lease: { unit: { propertyId: { in: propertyIds } } },
          status: InvoiceStatus.PAID,
        },
      }),
      prisma.invoice.count({
        where: {
          lease: { unit: { propertyId: { in: propertyIds } } },
          paymentReceipt: { not: null },
        },
      }),
    ]);

    return ApiResponse.success({
      message: "Data verifikasi invoice berhasil dimuat",
      data: invoices,
      meta: {
        pendingCount,
        paidCount,
        totalCount,
      },
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal memuat data verifikasi invoice",
      error,
    });
  }
}

/**
 * POST /api/finance/verification
 * Approve or Reject payment receipt for an invoice
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required");
    }

    if (authUser.role !== UserRole.OWNER && authUser.role !== UserRole.PLATFORM_ADMIN) {
      return ApiResponse.forbidden("Hanya Owner yang dapat memverifikasi pembayaran invoice.");
    }

    const body = await request.json();
    const { invoiceId, action, notes } = body; // action: "APPROVE" | "REJECT"

    if (!invoiceId || !action) {
      return ApiResponse.badRequest("invoiceId dan action (APPROVE/REJECT) wajib diisi.");
    }

    const propertyIds = await getOwnerPropertyIds(authUser.id);
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        lease: {
          unit: {
            propertyId: { in: propertyIds },
          },
        },
      },
      include: {
        lease: {
          include: {
            unit: { include: { property: true } },
            tenant: { include: { user: true } },
          },
        },
      },
    });

    if (!invoice) {
      return ApiResponse.notFound("Invoice tidak ditemukan atau Anda tidak memiliki akses.");
    }

    if (action === "APPROVE") {
      const paidAt = new Date();
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.PAID,
          paidAt,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          action: "INVOICE_PAYMENT_APPROVED",
          entityName: "Invoice",
          entityId: invoiceId,
          userId: authUser.id,
          details: {
            invoiceNumber: invoice.invoiceNumber,
            approvedBy: authUser.fullName,
            paidAt,
            notes: notes || "Pembayaran diverifikasi lunas oleh Owner",
          },
        },
      });

      // Send Confirmation Email
      const tenantEmail = invoice.lease.tenant.email || invoice.lease.tenant.user?.email;
      const tenantName = invoice.lease.tenant.fullName || invoice.lease.tenant.user?.fullName || "Penyewa";

      if (tenantEmail) {
        await sendPaymentReceiptEmail({
          to: tenantEmail,
          tenantName,
          invoiceNumber: invoice.invoiceNumber,
          amountPaid: `Rp ${Number(invoice.totalAmount).toLocaleString("id-ID")}`,
          paymentMethod: "Transfer Bank Pengelola",
          paidAt: paidAt.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }).catch((e) => console.error("Failed to send approval receipt email:", e));
      }

      return ApiResponse.success({
        message: `Invoice #${invoice.invoiceNumber} berhasil diverifikasi LUNAS`,
        data: updatedInvoice,
      });
    } else if (action === "REJECT") {
      // Revert status to PENDING (or OVERDUE if past due date)
      const now = new Date();
      const isOverdue = new Date(invoice.dueDate) < now;
      const newStatus = isOverdue ? InvoiceStatus.OVERDUE : InvoiceStatus.PENDING;

      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: newStatus,
          paymentReceipt: null, // Clear invalid payment receipt so tenant can re-upload
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          action: "INVOICE_PAYMENT_REJECTED",
          entityName: "Invoice",
          entityId: invoiceId,
          userId: authUser.id,
          details: {
            invoiceNumber: invoice.invoiceNumber,
            rejectedBy: authUser.fullName,
            reason: notes || "Bukti bayar tidak sesuai / tidak valid",
            newStatus,
          },
        },
      });

      return ApiResponse.success({
        message: `Bukti bayar Invoice #${invoice.invoiceNumber} ditolak. Tenant diminta mengunggah ulang.`,
        data: updatedInvoice,
      });
    } else {
      return ApiResponse.badRequest("Action tidak valid. Gunakan APPROVE atau REJECT.");
    }
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal memproses verifikasi invoice",
      error,
    });
  }
}
