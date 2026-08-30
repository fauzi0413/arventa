import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";

/**
 * GET /api/admin/features
 * Fetch all Master System Features catalog
 */
export async function GET() {
  try {
    const features = await prisma.saaSFeature.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            planFeatures: true,
          },
        },
      },
    });

    const formatted = features.map((f: any) => ({
      id: f.id,
      code: f.code,
      name: f.name,
      description: f.description,
      category: f.category,
      isEnabled: f.isEnabled,
      assignedPlansCount: f._count.planFeatures,
      createdAt: f.createdAt,
    }));

    return ApiResponse.success({
      message: "Berhasil mengambil master fitur sistem",
      data: formatted,
    });
  } catch (error: any) {
    console.error("GET /api/admin/features error:", error);
    return ApiResponse.error({
      message: "Gagal mengambil data master fitur",
      error,
      status: 500,
    });
  }
}

/**
 * POST /api/admin/features
 * Actions: CREATE_FEATURE, UPDATE_FEATURE, TOGGLE_FEATURE, DELETE_FEATURE
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || authUser.role !== UserRole.PLATFORM_ADMIN) {
      return ApiResponse.unauthorized("Akses ditolak. Hanya Platform Admin yang diizinkan.");
    }

    const body = await req.json();
    const { action } = body;

    // 1. Create Feature
    if (action === "CREATE_FEATURE") {
      const { code, name, description, category, isEnabled } = body;
      if (!code || !name) {
        return ApiResponse.error({
          message: "Kode fitur dan nama fitur wajib diisi",
          status: 400,
        });
      }

      const formattedCode = code.toUpperCase().trim().replace(/\s+/g, "_");
      const existing = await prisma.saaSFeature.findUnique({
        where: { code: formattedCode },
      });

      if (existing) {
        return ApiResponse.error({
          message: `Kode fitur "${formattedCode}" sudah digunakan.`,
          status: 400,
        });
      }

      const newFeature = await prisma.saaSFeature.create({
        data: {
          code: formattedCode,
          name: name.trim(),
          description: description ? description.trim() : null,
          category: category || "OPERATIONAL",
          isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
        },
      });

      return ApiResponse.success({
        message: `Fitur "${newFeature.name}" berhasil ditambahkan ke master sistem`,
        data: newFeature,
      });
    }

    // 2. Update Feature
    if (action === "UPDATE_FEATURE") {
      const { id, code, name, description, category, isEnabled } = body;
      if (!id) {
        return ApiResponse.error({
          message: "ID fitur wajib diisi",
          status: 400,
        });
      }

      const updateData: any = {};
      if (code) updateData.code = code.toUpperCase().trim().replace(/\s+/g, "_");
      if (name) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description ? description.trim() : null;
      if (category) updateData.category = category;
      if (isEnabled !== undefined) updateData.isEnabled = Boolean(isEnabled);

      const updated = await prisma.saaSFeature.update({
        where: { id },
        data: updateData,
      });

      return ApiResponse.success({
        message: `Fitur "${updated.name}" berhasil diperbarui`,
        data: updated,
      });
    }

    // 3. Toggle Status
    if (action === "TOGGLE_FEATURE") {
      const { id, isEnabled } = body;
      if (!id) {
        return ApiResponse.error({
          message: "ID fitur wajib diisi",
          status: 400,
        });
      }

      const updated = await prisma.saaSFeature.update({
        where: { id },
        data: { isEnabled: Boolean(isEnabled) },
      });

      return ApiResponse.success({
        message: `Status fitur "${updated.name}" berhasil diubah`,
        data: updated,
      });
    }

    // 4. Delete Feature
    if (action === "DELETE_FEATURE") {
      const { id } = body;
      if (!id) {
        return ApiResponse.error({
          message: "ID fitur wajib diisi",
          status: 400,
        });
      }

      await prisma.saaSFeature.delete({
        where: { id },
      });

      return ApiResponse.success({
        message: "Fitur berhasil dihapus dari master sistem",
      });
    }

    return ApiResponse.error({
      message: "Aksi tidak dikenal",
      status: 400,
    });
  } catch (error: any) {
    console.error("POST /api/admin/features error:", error);
    return ApiResponse.error({
      message: error.message || "Gagal memproses fitur sistem",
      error,
      status: 500,
    });
  }
}
