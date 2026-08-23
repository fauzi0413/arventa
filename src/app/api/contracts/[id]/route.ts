import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { LeaseStatus, UnitStatus } from "@/generated/prisma/client";

/**
 * GET /api/contracts/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lease = await prisma.lease.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                avatarUrl: true,
              },
            },
          },
        },
        unit: {
          include: {
            property: true,
          },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
        },
        leaseLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lease) {
      return ApiResponse.notFound("Kontrak tidak ditemukan.");
    }

    return ApiResponse.success({
      message: "Detail kontrak berhasil diambil",
      data: lease,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal mengambil detail kontrak",
      error,
    });
  }
}

/**
 * PUT /api/contracts/[id]
 * Update contract status, dates, prices, etc.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, startDate, endDate, rentPrice, securityDeposit, notes, customClauses } = body;

    const existingLease = await prisma.lease.findUnique({
      where: { id },
      include: { unit: { include: { property: true } } },
    });

    if (!existingLease) {
      return ApiResponse.notFound("Kontrak tidak ditemukan.");
    }

    const updatedLease = await prisma.$transaction(async (tx) => {
      const newStatus = (status || existingLease.status) as LeaseStatus;

      const lease = await tx.lease.update({
        where: { id },
        data: {
          status: newStatus,
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(rentPrice !== undefined && { rentPrice: Number(rentPrice) }),
          ...(securityDeposit !== undefined && { securityDeposit: Number(securityDeposit) }),
          ...(notes !== undefined && { notes }),
          ...(customClauses !== undefined && { customClauses: Array.isArray(customClauses) ? customClauses : [] }),
        },
        include: {
          tenant: {
            include: { user: true },
          },
          unit: {
            include: { property: true },
          },
        },
      });

      // Update unit status based on lease status & create initial Invoice if activating
      if (existingLease.status !== newStatus) {
        if (newStatus === LeaseStatus.ACTIVE) {
          await tx.unit.update({
            where: { id: existingLease.unitId },
            data: { status: UnitStatus.OCCUPIED },
          });

          // Auto-generate initial Invoice if activating contract
          const existingInvoice = await tx.invoice.findFirst({
            where: { leaseId: lease.id },
          });

          if (!existingInvoice) {
            const invNumber = `INV/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${Math.floor(1000 + Math.random() * 9000)}`;
            const rentAmt = Number(lease.rentPrice || 0);
            const depAmt = Number(lease.securityDeposit || 0);

            await tx.invoice.create({
              data: {
                invoiceNumber: invNumber,
                leaseId: lease.id,
                amount: rentAmt,
                utilityAmount: 0,
                penaltyAmount: 0,
                totalAmount: rentAmt + depAmt,
                dueDate: lease.startDate,
                status: "PENDING",
              },
            });
          }
        } else if (newStatus === LeaseStatus.TERMINATED || newStatus === LeaseStatus.EXPIRED) {
          await tx.unit.update({
            where: { id: existingLease.unitId },
            data: { status: UnitStatus.AVAILABLE },
          });
        }

        // Log status change
        await tx.leaseLog.create({
          data: {
            leaseId: lease.id,
            tenantId: lease.tenantId,
            unitId: lease.unitId,
            actionType: "STATUS_CHANGE",
            title: `Status Kontrak Diperbarui: ${newStatus}`,
            description: `Perubahan status kontrak dari ${existingLease.status} menjadi ${newStatus}.${notes ? ` Catatan: ${notes}` : ""}`,
            propertyName: lease.unit.property.name,
            unitName: lease.unit.unitNumber,
            fromStatus: existingLease.status,
            toStatus: newStatus === LeaseStatus.ACTIVE ? "AKTIF" : newStatus === LeaseStatus.TERMINATED ? "NONAKTIF" : "CALON",
          },
        });
      }

      return lease;
    });

    return ApiResponse.success({
      message: "Kontrak penyewa berhasil diperbarui",
      data: updatedLease,
    });
  } catch (error: any) {
    return ApiResponse.error({
      message: error.message || "Gagal memperbarui kontrak penyewa",
      error,
      status: 400,
    });
  }
}

/**
 * DELETE /api/contracts/[id]
 * Delete/cancel contract record.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingLease = await prisma.lease.findUnique({
      where: { id },
    });

    if (!existingLease) {
      return ApiResponse.notFound("Kontrak tidak ditemukan.");
    }

    await prisma.$transaction(async (tx) => {
      // Free unit if active
      if (existingLease.status === LeaseStatus.ACTIVE) {
        await tx.unit.update({
          where: { id: existingLease.unitId },
          data: { status: UnitStatus.AVAILABLE },
        });
      }

      // Delete linked logs and invoices
      await tx.leaseLog.deleteMany({ where: { leaseId: id } });
      await tx.invoice.deleteMany({ where: { leaseId: id } });
      await tx.lease.delete({ where: { id } });
    });

    return ApiResponse.success({
      message: "Kontrak penyewa berhasil dihapus",
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal menghapus kontrak penyewa",
      error,
    });
  }
}
