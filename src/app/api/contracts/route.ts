import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { LeaseStatus, RentalPeriodType, UnitStatus } from "@/generated/prisma/client";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { UserRole } from "@/types/roles";

/**
 * GET /api/contracts
 * Fetch all leases/contracts scoped to the current authenticated user/owner.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const statusParam = searchParams.get("status") || undefined;
    const propertyId = searchParams.get("propertyId") || undefined;

    const authUser = await getAuthenticatedUser(request);

    const where: any = {};

    if (statusParam && statusParam !== "ALL") {
      where.status = statusParam as LeaseStatus;
    }

    if (propertyId) {
      where.unit = { ...(where.unit || {}), propertyId };
    }

    if (authUser) {
      if (authUser.role === UserRole.OWNER) {
        const ownerProperties = await prisma.property.findMany({
          where: {
            OR: [
              { ownerId: authUser.id },
              { owner: { email: authUser.email } },
            ],
          },
          select: { id: true },
        });

        const ownerPropIds = ownerProperties.map((p) => p.id);

        if (ownerPropIds.length > 0) {
          where.unit = {
            ...(where.unit || {}),
            propertyId: { in: ownerPropIds },
          };
        } else {
          return ApiResponse.success({
            message: "Daftar kontrak penyewa berhasil diambil",
            data: [],
          });
        }
      } else if (authUser.role === UserRole.HOUSEKEEPING) {
        const assignments = await prisma.housekeepingAssignment.findMany({
          where: { userId: authUser.id },
          select: { propertyId: true },
        });
        const propertyIds = assignments.map((a) => a.propertyId);
        where.unit = {
          ...(where.unit || {}),
          propertyId: { in: propertyIds },
        };
      } else if (authUser.role === UserRole.USER || authUser.role === UserRole.TENANT) {
        where.tenant = { userId: authUser.id };
      }
    }

    if (search) {
      where.OR = [
        { tenant: { fullName: { contains: search, mode: "insensitive" } } },
        { tenant: { email: { contains: search, mode: "insensitive" } } },
        { tenant: { user: { fullName: { contains: search, mode: "insensitive" } } } },
        { unit: { unitNumber: { contains: search, mode: "insensitive" } } },
        { unit: { property: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const leases = await prisma.lease.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
            unitUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                type: true,
                owner: {
                  select: {
                    id: true,
                    fullName: true,
                    phoneNumber: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return ApiResponse.success({
      message: "Daftar kontrak penyewa berhasil diambil",
      data: leases,
    });
  } catch (error) {
    return ApiResponse.error({
      message: "Gagal mengambil data kontrak penyewa",
      error,
    });
  }
}

/**
 * POST /api/contracts
 * Create a new contract (Lease) for a unit or whole property.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      tenantName,
      tenantPhone,
      tenantEmail,
      unitId,
      propertyId,
      rentalPeriod = "MONTHLY",
      startDate,
      endDate,
      rentPrice,
      securityDeposit = 0,
      status = "ACTIVE",
      notes,
      customClauses,
    } = body;

    if (!startDate || !rentPrice) {
      return ApiResponse.badRequest("Tanggal mulai dan harga sewa wajib diisi.");
    }

    const result = await prisma.$transaction(async (tx) => {
      let targetTenantId = tenantId;

      // 1. Find or create TenantProfile if tenantId not provided directly
      if (!targetTenantId) {
        if (!tenantName) {
          throw new Error("Nama penyewa wajib diisi.");
        }

        const cleanPhone = (tenantPhone || "").trim();
        const pseudoEmail = tenantEmail || null;

        let existingProfile = cleanPhone
          ? await tx.tenantProfile.findFirst({
              where: { phoneNumber: cleanPhone },
            })
          : null;

        if (!existingProfile) {
          existingProfile = await tx.tenantProfile.create({
            data: {
              fullName: tenantName.trim(),
              email: pseudoEmail,
              phoneNumber: cleanPhone || null,
              userId: null,
            },
          });
        }

        targetTenantId = existingProfile.id;
      }

      if (!targetTenantId) {
        throw new Error("Gagal menentukan profil penyewa.");
      }

      // 2. Determine target unit
      let resolvedUnitId = unitId;
      if (!resolvedUnitId && propertyId) {
        // Find or create default main unit for full property rental
        const firstUnit = await tx.unit.findFirst({
          where: { propertyId },
          orderBy: { createdAt: "asc" },
        });

        if (firstUnit) {
          resolvedUnitId = firstUnit.id;
        } else {
          // Create dummy unit for full property contract
          const newUnit = await tx.unit.create({
            data: {
              propertyId,
              unitNumber: "Gedung Utuh / Seluruh Properti",
              basePrice: rentPrice,
              status: status === "ACTIVE" ? UnitStatus.OCCUPIED : UnitStatus.AVAILABLE,
            },
          });
          resolvedUnitId = newUnit.id;
        }
      }

      if (!resolvedUnitId) {
        throw new Error("Pilih unit atau properti untuk kontrak sewa.");
      }

      // 3. Compute Dates
      const start = new Date(startDate);
      let end = endDate ? new Date(endDate) : new Date(start);
      if (!endDate) {
        if (rentalPeriod === "DAILY") end.setDate(end.getDate() + 1);
        else if (rentalPeriod === "YEARLY") end.setFullYear(end.getFullYear() + 1);
        else end.setMonth(end.getMonth() + 1); // MONTHLY
      }

      // 3b. Fetch property contract template if available
      const resolvedPropId = propertyId || (resolvedUnitId ? (await tx.unit.findUnique({ where: { id: resolvedUnitId } }))?.propertyId : null);
      const propTemplate = resolvedPropId
        ? await tx.propertyContractTemplate.findUnique({ where: { propertyId: resolvedPropId } })
        : null;

      const finalCustomClauses =
        Array.isArray(customClauses) && customClauses.length > 0
          ? customClauses
          : propTemplate?.customClauses || [];

      const finalNotes = notes || propTemplate?.rules || null;

      // 4. Create Lease
      const newLease = await tx.lease.create({
        data: {
          unitId: resolvedUnitId,
          tenantId: targetTenantId,
          templateId: propTemplate?.id || null,
          rentalPeriod: rentalPeriod as RentalPeriodType,
          startDate: start,
          endDate: end,
          rentPrice: Number(rentPrice),
          securityDeposit: Number(securityDeposit),
          status: status as LeaseStatus,
          customClauses: finalCustomClauses,
          notes: finalNotes,
        },
        include: {
          tenant: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  phoneNumber: true,
                  email: true,
                },
              },
            },
          },
          unit: {
            include: {
              unitUser: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
              property: true,
            },
          },
        },
      });

      // 5. Update unit status & create initial Invoice if lease is ACTIVE
      if (status === "ACTIVE") {
        await tx.unit.update({
          where: { id: resolvedUnitId },
          data: { status: UnitStatus.OCCUPIED },
        });

        // Auto-generate initial Invoice (Rent + Deposit) for ACTIVE contract
        const invNumber = `INV/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${Math.floor(1000 + Math.random() * 9000)}`;
        const rentAmt = Number(rentPrice || 0);
        const depAmt = Number(securityDeposit || 0);

        const existingInvoice = await tx.invoice.findFirst({
          where: { leaseId: newLease.id },
        });

        if (!existingInvoice) {
          await tx.invoice.create({
            data: {
              invoiceNumber: invNumber,
              leaseId: newLease.id,
              amount: rentAmt,
              utilityAmount: 0,
              penaltyAmount: 0,
              totalAmount: rentAmt + depAmt,
              dueDate: start,
              status: "PENDING",
            },
          });
        }
      }

      // 6. Log Lease Creation
      await tx.leaseLog.create({
        data: {
          leaseId: newLease.id,
          tenantId: targetTenantId,
          unitId: resolvedUnitId,
          actionType: status === "ACTIVE" ? "INITIAL_PLACEMENT" : "REGISTERED",
          title: `Kontrak Sewa Dibuat (${status})`,
          description: `Kontrak sewa baru dibuat untuk unit ${newLease.unit.unitNumber} pada properti ${newLease.unit.property.name}.${notes ? ` Catatan: ${notes}` : ""}`,
          propertyName: newLease.unit.property.name,
          unitName: newLease.unit.unitNumber,
          toStatus: status === "ACTIVE" ? "AKTIF" : status,
        },
      });

      return newLease;
    });

    return ApiResponse.success({
      message: "Kontrak penyewa berhasil dibuat",
      data: result,
      status: 201,
    });
  } catch (error: any) {
    return ApiResponse.error({
      message: error.message || "Gagal membuat kontrak penyewa",
      error,
      status: 400,
    });
  }
}
