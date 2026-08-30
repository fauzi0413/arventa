import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { prisma } from "@/lib/prisma";
import {
  UserRole,
  MaintenanceStatus,
  CostLiability,
  ExpenseCategory,
  UnitStatus,
} from "@/generated/prisma/client";

/**
 * GET /api/maintenance/[id]
 * Fetch single ticket details along with full audit timeline.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi pengguna tidak valid atau telah berakhir");
    }

    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id },
      include: {
        property: true,
        unit: true,
        reportedBy: { select: { id: true, fullName: true, role: true, email: true, phoneNumber: true } },
        assignedStaff: { select: { id: true, fullName: true, role: true, email: true, phoneNumber: true } },
        timelines: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!ticket) {
      return ApiResponse.notFound("Laporan / tiket maintenance tidak ditemukan");
    }

    return ApiResponse.success({
      message: "Detail tiket berhasil diambil",
      data: ticket,
    });
  } catch (error: any) {
    console.error("GET /api/maintenance/[id] error:", error);
    return ApiResponse.error({
      message: "Gagal mengambil detail tiket",
      error: error?.message || error,
      status: 500,
    });
  }
}

/**
 * PATCH /api/maintenance/[id]
 * Update ticket lifecycle (Start repair, complete checklist, upload photos, resolve ticket, assign PIC, update costs).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Sesi pengguna tidak valid atau telah berakhir");
    }

    const existingTicket = await prisma.maintenanceTicket.findUnique({
      where: { id },
      include: { unit: true, property: true },
    });

    if (!existingTicket) {
      return ApiResponse.notFound("Tiket maintenance tidak ditemukan");
    }

    const body = await request.json();
    const {
      status, // IN_PROGRESS, RESOLVED, CANCELLED, etc.
      checklist,
      photosBefore,
      photosAfter,
      resolutionNotes,
      assignedStaffId,
      assignedStaffName,
      costLiability,
      estimatedCost,
      actualCost,
      vendorName,
      damageAnalysis,
      timelineNotes,
    } = body;

    // Role-based validations
    const isOwner = authUser.role === UserRole.OWNER || authUser.role === UserRole.PLATFORM_ADMIN;
    const isHousekeeper = authUser.role === UserRole.HOUSEKEEPING;

    // Map UI statuses to MaintenanceStatus enum
    let nextStatus: MaintenanceStatus = existingTicket.status;
    if (status) {
      const statusMap: Record<string, MaintenanceStatus> = {
        REQUESTED: MaintenanceStatus.REPORTED,
        REPORTED: MaintenanceStatus.REPORTED,
        IN_CLEANING: MaintenanceStatus.IN_PROGRESS,
        IN_PROGRESS: MaintenanceStatus.IN_PROGRESS,
        INSPECTION: MaintenanceStatus.IN_PROGRESS,
        AWAITING_APPROVAL: MaintenanceStatus.IN_PROGRESS,
        WAITING_PARTS: MaintenanceStatus.WAITING_PARTS,
        COMPLETED: MaintenanceStatus.RESOLVED,
        RESOLVED: MaintenanceStatus.RESOLVED,
        CLOSED: MaintenanceStatus.RESOLVED,
        CANCELLED: MaintenanceStatus.CANCELLED,
      };
      nextStatus = statusMap[status] || (status as MaintenanceStatus);
    }

    // Prepare update data
    const updateData: any = {};

    if (status) {
      updateData.status = nextStatus;
      if (nextStatus === MaintenanceStatus.RESOLVED) {
        updateData.resolvedAt = new Date();
      }
    }

    if (checklist !== undefined) {
      updateData.checklist = checklist;
    }

    if (photosBefore && Array.isArray(photosBefore)) {
      updateData.photosBefore = photosBefore;
    }

    if (photosAfter && Array.isArray(photosAfter)) {
      updateData.photosAfter = photosAfter;
    }

    if (resolutionNotes !== undefined) {
      updateData.resolutionNotes = resolutionNotes;
    }

    if (damageAnalysis !== undefined) {
      updateData.damageAnalysis = damageAnalysis;
    }

    // Owner-only fields
    if (isOwner) {
      if (costLiability) updateData.costLiability = costLiability as CostLiability;
      if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost ? Number(estimatedCost) : null;
      if (actualCost !== undefined) updateData.actualCost = actualCost ? Number(actualCost) : null;
      if (vendorName !== undefined) updateData.vendorName = vendorName;
      if (assignedStaffId !== undefined) updateData.assignedStaffId = assignedStaffId || null;
      if (assignedStaffName !== undefined) updateData.assignedStaffName = assignedStaffName || null;
    } else if (isHousekeeper && !existingTicket.assignedStaffId) {
      // Housekeeper can claim self as PIC if unassigned
      updateData.assignedStaffId = authUser.id;
      updateData.assignedStaffName = authUser.fullName;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.maintenanceTicket.update({
        where: { id },
        data: updateData,
        include: { timelines: true, unit: true, property: true },
      });

      // Create a timeline log entry if status changed or notes provided
      const logStatus = status || result.status;
      const performerRole = authUser.role === UserRole.OWNER ? "Owner" : authUser.role === UserRole.HOUSEKEEPING ? "Housekeeper" : "User";
      const notes =
        timelineNotes ||
        resolutionNotes ||
        `Status tiket diperbarui menjadi ${result.status} oleh ${authUser.fullName}.`;

      await tx.maintenanceTimeline.create({
        data: {
          ticketId: id,
          status: logStatus,
          performerId: authUser.id,
          performerName: authUser.fullName,
          performerRole,
          notes,
        },
      });

      // If resolved and unit is currently in MAINTENANCE or CLEANING, check if unit should revert
      if (nextStatus === MaintenanceStatus.RESOLVED && existingTicket.unitId && existingTicket.unit) {
        const u = existingTicket.unit;
        if (u.status === UnitStatus.MAINTENANCE || u.status === UnitStatus.CLEANING) {
          // Check if any active lease exists
          const activeLease = await tx.lease.findFirst({
            where: { unitId: u.id, status: "ACTIVE" },
          });

          const restoredStatus = activeLease ? UnitStatus.OCCUPIED : UnitStatus.AVAILABLE;

          await tx.unit.update({
            where: { id: u.id },
            data: { status: restoredStatus },
          });

          await tx.unitStatusLog.create({
            data: {
              unitId: u.id,
              changedById: authUser.id,
              previousStatus: u.status,
              newStatus: restoredStatus,
              notes: `Tiket ${existingTicket.ticketNumber} selesai. Status unit dikembalikan ke ${restoredStatus}.`,
            },
          });
        }
      }

      // If Owner provided actualCost and it's resolved, create an Expense record automatically if not already created
      if (isOwner && actualCost && Number(actualCost) > 0 && nextStatus === MaintenanceStatus.RESOLVED) {
        const existingExpense = await tx.expense.findFirst({
          where: {
            propertyId: existingTicket.propertyId,
            notes: { contains: existingTicket.ticketNumber },
          },
        });

        if (!existingExpense) {
          await tx.expense.create({
            data: {
              propertyId: existingTicket.propertyId,
              unitId: existingTicket.unitId,
              createdById: authUser.id,
              title: `Biaya Perbaikan: ${existingTicket.title}`,
              category: ExpenseCategory.MAINTENANCE,
              amount: Number(actualCost),
              expenseDate: new Date(),
              notes: `Biaya perbaikan resmi dari tiket maintenance [${existingTicket.ticketNumber}]. Beban biaya: ${costLiability || existingTicket.costLiability || "OWNER"}.`,
            },
          });
        }
      }

      return result;
    });

    return ApiResponse.success({
      message: "Tiket berhasil diperbarui",
      data: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/maintenance/[id] error:", error);
    return ApiResponse.error({
      message: "Gagal memperbarui tiket maintenance",
      error: error?.message || error,
      status: 500,
    });
  }
}
