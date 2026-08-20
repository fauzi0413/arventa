import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";

function getPaymentMethodModel() {
  if ((prisma as any).saaSPaymentMethod) {
    return (prisma as any).saaSPaymentMethod;
  }
  // Re-instantiate if globalThis cached stale PrismaClient before model generation
  const { PrismaClient } = require("../../../../../generated/prisma/client");
  const { PrismaPg } = require("@prisma/adapter-pg");
  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  const freshClient = new PrismaClient({ adapter });
  (globalThis as any).prisma = freshClient;
  return freshClient.saaSPaymentMethod;
}

/**
 * GET /api/admin/payment-methods
 * Fetch all SaaS Payment Bank Accounts & QRIS Methods from Prisma DB table saas_payment_methods.
 */
export async function GET() {
  try {
    const model = getPaymentMethodModel();
    const paymentMethods = await model.findMany({
      orderBy: { createdAt: "asc" },
    });

    return ApiResponse.success({
      message: "Berhasil mengambil data rekening pembayaran SaaS",
      data: { paymentMethods },
    });
  } catch (error) {
    console.error("GET /api/admin/payment-methods error:", error);
    return ApiResponse.error({
      message: "Gagal mengambil data rekening pembayaran SaaS",
      error,
      status: 500,
    });
  }
}

/**
 * POST /api/admin/payment-methods
 * Manage SaaS Payment Methods (Create, Update, Toggle, Delete).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;
    const model = getPaymentMethodModel();

    // 1. Create New Payment Method
    if (action === "CREATE") {
      const { bankName, accountNumber, accountHolder, notes, isEnabled, badgeColor } = body;

      if (!bankName || !accountNumber || !accountHolder) {
        return ApiResponse.error({
          message: "Nama Bank, Nomor Rekening, dan Atas Nama wajib diisi",
          status: 400,
        });
      }

      const created = await model.create({
        data: {
          bankName,
          accountNumber,
          accountHolder,
          notes: notes || null,
          isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
          badgeColor: badgeColor || "bg-[#242823]",
        },
      });

      return ApiResponse.success({
        message: `Rekening bank "${bankName}" berhasil ditambahkan`,
        data: created,
      });
    }

    // 2. Update Existing Payment Method
    if (action === "UPDATE") {
      const { id, bankName, accountNumber, accountHolder, notes, isEnabled, badgeColor } = body;

      if (!id || !bankName || !accountNumber || !accountHolder) {
        return ApiResponse.error({
          message: "ID, Nama Bank, Nomor Rekening, dan Atas Nama wajib diisi",
          status: 400,
        });
      }

      const updated = await model.update({
        where: { id },
        data: {
          bankName,
          accountNumber,
          accountHolder,
          notes: notes || null,
          isEnabled: Boolean(isEnabled),
          badgeColor: badgeColor || "bg-[#242823]",
        },
      });

      return ApiResponse.success({
        message: `Rekening bank "${bankName}" berhasil diperbarui`,
        data: updated,
      });
    }

    // 3. Toggle Status (Active / Inactive)
    if (action === "TOGGLE") {
      const { id } = body;

      if (!id) {
        return ApiResponse.error({
          message: "ID rekening wajib diisi",
          status: 400,
        });
      }

      const existing = await model.findUnique({ where: { id } });
      if (!existing) {
        return ApiResponse.error({
          message: "Rekening bank tidak ditemukan",
          status: 404,
        });
      }

      const updated = await model.update({
        where: { id },
        data: { isEnabled: !existing.isEnabled },
      });

      return ApiResponse.success({
        message: `Status rekening "${existing.bankName}" berhasil diubah menjadi ${updated.isEnabled ? "AKTIF" : "NON-AKTIF"}`,
        data: updated,
      });
    }

    // 4. Delete Payment Method
    if (action === "DELETE") {
      const { id } = body;

      if (!id) {
        return ApiResponse.error({
          message: "ID rekening wajib diisi",
          status: 400,
        });
      }

      const deleted = await model.delete({
        where: { id },
      });

      return ApiResponse.success({
        message: `Rekening bank "${deleted.bankName}" berhasil dihapus`,
        data: deleted,
      });
    }

    return ApiResponse.error({
      message: "Aksi tidak valid",
      status: 400,
    });
  } catch (error) {
    console.error("POST /api/admin/payment-methods error:", error);
    return ApiResponse.error({
      message: "Terjadi kesalahan server saat mengelola rekening bank",
      error,
      status: 500,
    });
  }
}
