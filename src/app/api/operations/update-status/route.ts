import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { UnitStatus } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return ApiResponse.error({
        message: "Pengguna belum terautentikasi",
        status: 401,
      });
    }

    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseAuthId: authUser.id },
          { email: authUser.email || "" },
        ],
      },
    });

    if (!dbUser) {
      return ApiResponse.error({
        message: "Pengguna tidak ditemukan di database",
        status: 404,
      });
    }

    const body = await request.json();
    const { unitId, newStatus, notes } = body;

    if (!unitId || !newStatus) {
      return ApiResponse.error({
        message: "Unit ID dan status baru harus diisi",
        status: 400,
      });
    }

    const targetUnit = await prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!targetUnit) {
      return ApiResponse.error({
        message: "Unit tidak ditemukan",
        status: 404,
      });
    }

    const previousStatus = targetUnit.status;

    // Update unit status and create unit status log in a transaction
    const [updatedUnit, statusLog] = await prisma.$transaction([
      prisma.unit.update({
        where: { id: unitId },
        data: { status: newStatus as UnitStatus },
      }),
      prisma.unitStatusLog.create({
        data: {
          unitId,
          changedById: dbUser.id,
          previousStatus,
          newStatus: newStatus as UnitStatus,
          notes: notes || `Status diubah dari ${previousStatus} menjadi ${newStatus}`,
        },
      }),
    ]);

    return ApiResponse.success({
      message: `Status kamar ${updatedUnit.unitNumber} berhasil diperbarui ke ${newStatus}`,
      data: {
        unit: updatedUnit,
        log: statusLog,
      },
    });
  } catch (error: any) {
    console.error("Error updating unit status:", error);
    return ApiResponse.error({
      message: "Gagal memperbarui status unit",
      error: error?.message || error,
      status: 500,
    });
  }
}
