import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";

/**
 * GET /api/admin/add-ons
 * Fetch all SaaS Add-Ons catalog
 */
export async function GET() {
  try {
    const addOns = await prisma.saaSAddOn.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            subscriptionAddOns: true,
          },
        },
      },
    });

    const formatted = addOns.map((a: any) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      unitQuota: a.unitQuota,
      priceMonthly: Number(a.priceMonthly),
      priceYearly: Number(a.priceYearly),
      description: a.description,
      status: a.status,
      activePurchasesCount: a._count.subscriptionAddOns,
      createdAt: a.createdAt,
    }));

    return ApiResponse.success({
      message: "Berhasil mengambil katalog Add-On SaaS",
      data: formatted,
    });
  } catch (error: any) {
    console.error("GET /api/admin/add-ons error:", error);
    return ApiResponse.error({
      message: "Gagal mengambil data Add-On SaaS",
      error,
      status: 500,
    });
  }
}

/**
 * POST /api/admin/add-ons
 * Actions: CREATE_ADDON, UPDATE_ADDON, TOGGLE_ADDON, DELETE_ADDON
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || authUser.role !== UserRole.PLATFORM_ADMIN) {
      return ApiResponse.unauthorized("Akses ditolak. Hanya Platform Admin yang diizinkan.");
    }

    const body = await req.json();
    const { action } = body;

    // 1. Create Add-On
    if (action === "CREATE_ADDON") {
      const { name, category, unitQuota, priceMonthly, priceYearly, description, status } = body;
      if (!name || priceMonthly === undefined) {
        return ApiResponse.error({
          message: "Nama Add-On dan harga bulanan wajib diisi",
          status: 400,
        });
      }

      const newAddOn = await prisma.saaSAddOn.create({
        data: {
          name: name.trim(),
          category: category || "UNIT",
          unitQuota: Math.max(0, parseInt(unitQuota || "1", 10)),
          priceMonthly: Math.max(0, parseFloat(priceMonthly)),
          priceYearly: Math.max(0, parseFloat(priceYearly || priceMonthly * 10)),
          description: description ? description.trim() : null,
          status: status || "ACTIVE",
        },
      });

      return ApiResponse.success({
        message: `Add-On "${newAddOn.name}" berhasil dibuat`,
        data: newAddOn,
      });
    }

    // 2. Update Add-On
    if (action === "UPDATE_ADDON") {
      const { id, name, category, unitQuota, priceMonthly, priceYearly, description, status } = body;
      if (!id) {
        return ApiResponse.error({
          message: "ID Add-On wajib diisi",
          status: 400,
        });
      }

      const updateData: any = {};
      if (name) updateData.name = name.trim();
      if (category) updateData.category = category;
      if (unitQuota !== undefined) updateData.unitQuota = Math.max(0, parseInt(unitQuota, 10));
      if (priceMonthly !== undefined) updateData.priceMonthly = Math.max(0, parseFloat(priceMonthly));
      if (priceYearly !== undefined) updateData.priceYearly = Math.max(0, parseFloat(priceYearly));
      if (description !== undefined) updateData.description = description ? description.trim() : null;
      if (status) updateData.status = status;

      const updated = await prisma.saaSAddOn.update({
        where: { id },
        data: updateData,
      });

      return ApiResponse.success({
        message: `Add-On "${updated.name}" berhasil diperbarui`,
        data: updated,
      });
    }

    // 3. Toggle Status
    if (action === "TOGGLE_ADDON") {
      const { id, status } = body;
      if (!id) {
        return ApiResponse.error({
          message: "ID Add-On wajib diisi",
          status: 400,
        });
      }

      const updated = await prisma.saaSAddOn.update({
        where: { id },
        data: { status },
      });

      return ApiResponse.success({
        message: `Status Add-On "${updated.name}" berhasil diubah menjadi ${status}`,
        data: updated,
      });
    }

    // 4. Delete Add-On
    if (action === "DELETE_ADDON") {
      const { id } = body;
      if (!id) {
        return ApiResponse.error({
          message: "ID Add-On wajib diisi",
          status: 400,
        });
      }

      await prisma.saaSAddOn.delete({
        where: { id },
      });

      return ApiResponse.success({
        message: "Add-On berhasil dihapus dari katalog",
      });
    }

    return ApiResponse.error({
      message: "Aksi tidak dikenal",
      status: 400,
    });
  } catch (error: any) {
    console.error("POST /api/admin/add-ons error:", error);
    return ApiResponse.error({
      message: error.message || "Gagal memproses Add-On SaaS",
      error,
      status: 500,
    });
  }
}
