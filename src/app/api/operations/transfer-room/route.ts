import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { UnitStatus, MaintenanceType, MaintenanceStatus, ReportPriority, CostLiability } from "@/generated/prisma/client";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

/**
 * POST /api/operations/transfer-room
 * Transfer tenant from source unit to target unit:
 * - Moves active lease to target unit
 * - Updates target unit status to OCCUPIED
 * - Updates source unit status to CLEANING
 * - Logs unit status changes
 * - Creates a housekeeping cleaning ticket for the vacated room
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi tidak valid atau telah berakhir");
    }

    const body = await request.json();
    const { sourceUnitId, targetUnitId, notes } = body;

    if (!sourceUnitId || !targetUnitId) {
      return ApiResponse.badRequest("Kamar asal (sourceUnitId) dan kamar tujuan (targetUnitId) wajib diisi");
    }

    if (sourceUnitId === targetUnitId) {
      return ApiResponse.badRequest("Kamar asal dan kamar tujuan tidak boleh sama");
    }

    const [sourceUnit, targetUnit] = await Promise.all([
      prisma.unit.findUnique({ where: { id: sourceUnitId }, include: { property: true } }),
      prisma.unit.findUnique({ where: { id: targetUnitId }, include: { property: true } }),
    ]);

    if (!sourceUnit || !targetUnit) {
      return ApiResponse.notFound("Satu atau kedua unit tidak ditemukan");
    }

    // Find active lease on source unit
    const activeLease = await prisma.lease.findFirst({
      where: { unitId: sourceUnitId, status: "ACTIVE" },
      include: {
        tenant: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    const tenantName = activeLease?.tenant?.user?.fullName || activeLease?.tenant?.fullName || "Penghuni";

    const result = await prisma.$transaction(async (tx) => {
      // 1. If active lease exists, transfer it to target unit
      if (activeLease) {
        await tx.lease.update({
          where: { id: activeLease.id },
          data: { unitId: targetUnitId },
        });
      }

      // 2. Set source unit to CLEANING
      const updatedSource = await tx.unit.update({
        where: { id: sourceUnitId },
        data: { status: UnitStatus.CLEANING },
      });

      // 3. Set target unit to OCCUPIED
      const updatedTarget = await tx.unit.update({
        where: { id: targetUnitId },
        data: { status: UnitStatus.OCCUPIED },
      });

      // 4. Log status change for source unit
      await tx.unitStatusLog.create({
        data: {
          unitId: sourceUnitId,
          changedById: authUser.id,
          previousStatus: sourceUnit.status,
          newStatus: UnitStatus.CLEANING,
          notes: notes || `Pindah kamar: Penghuni (${tenantName}) dipindahkan ke unit ${targetUnit.unitNumber}. Unit siap dibersihkan.`,
        },
      });

      // 5. Log status change for target unit
      await tx.unitStatusLog.create({
        data: {
          unitId: targetUnitId,
          changedById: authUser.id,
          previousStatus: targetUnit.status,
          newStatus: UnitStatus.OCCUPIED,
          notes: notes || `Pindah kamar: Penghuni (${tenantName}) dipindahkan dari unit ${sourceUnit.unitNumber}.`,
        },
      });

      // 6. Create housekeeping ticket for cleaning source unit
      const year = new Date().getFullYear();
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const ticketNumber = `HK-${year}-${randSuffix}`;

      await tx.maintenanceTicket.create({
        data: {
          ticketNumber,
          propertyId: sourceUnit.propertyId,
          unitId: sourceUnit.id,
          type: MaintenanceType.HOUSEKEEPING,
          serviceType: "CHECKOUT_CLEAN",
          title: `Pembersihan Pasca Pindah Kamar (Unit ${sourceUnit.unitNumber})`,
          description: `Penghuni (${tenantName}) telah dipindahkan ke unit ${targetUnit.unitNumber}. Kamar asal butuh pembersihan mendalam (Fast Clean / Checkout Clean).`,
          priority: ReportPriority.HIGH,
          status: MaintenanceStatus.REPORTED,
          reportedById: authUser.id,
          reportedByName: authUser.fullName,
          reportedByRole: authUser.role,
          costLiability: CostLiability.OWNER,
        },
      });

      return { source: updatedSource, target: updatedTarget };
    });

    return ApiResponse.success({
      message: `Berhasil memindahkan ${tenantName} dari ${sourceUnit.unitNumber} ke ${targetUnit.unitNumber}`,
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/operations/transfer-room error:", error);
    return ApiResponse.error({
      message: "Gagal memproses transfer kamar",
      error: error?.message || error,
      status: 500,
    });
  }
}
