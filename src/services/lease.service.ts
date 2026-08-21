import { prisma } from "@/lib/prisma";
import { LeaseStatus, RentalPeriodType, UnitStatus, UserRole } from "@/generated/prisma/client";

export interface AssignTenantInput {
  tenantName: string;
  tenantPhone?: string;
  checkInDate: string;
  monthlyRent?: number;
  deposit?: number;
}

export class LeaseService {
  /**
   * Get active lease for a specific unit
   */
  static async getActiveLeaseByUnitId(unitId: string) {
    return prisma.lease.findFirst({
      where: {
        unitId,
        status: LeaseStatus.ACTIVE,
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
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Assign a tenant to a unit by creating a new active Lease and Tenant User/Profile
   */
  static async assignTenantToUnit(unitId: string, input: AssignTenantInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Check if unit exists
      const unit = await tx.unit.findUnique({
        where: { id: unitId },
        include: { property: true },
      });

      if (!unit) {
        throw new Error(`Unit dengan ID '${unitId}' tidak ditemukan.`);
      }

      // 2. Find or create Tenant User & Profile
      const cleanPhone = (input.tenantPhone || "").trim();
      const sanitizedName = input.tenantName.trim();
      const pseudoEmail = `tenant.${Date.now()}.${Math.random().toString(36).substring(2, 6)}@tenant.arventa.id`;

      let tenantUser = cleanPhone
        ? await tx.user.findFirst({
            where: {
              phoneNumber: cleanPhone,
              role: UserRole.TENANT,
            },
            include: { tenantProfile: true },
          })
        : null;

      if (!tenantUser) {
        tenantUser = await tx.user.create({
          data: {
            fullName: sanitizedName,
            phoneNumber: cleanPhone || null,
            email: pseudoEmail,
            role: UserRole.TENANT,
            tenantProfile: {
              create: {},
            },
          },
          include: { tenantProfile: true },
        });
      } else if (!tenantUser.tenantProfile) {
        await tx.tenantProfile.create({
          data: { userId: tenantUser.id },
        });
        tenantUser = await tx.user.findUnique({
          where: { id: tenantUser.id },
          include: { tenantProfile: true },
        });
      }

      const tenantProfileId = tenantUser?.tenantProfile?.id;
      if (!tenantProfileId) {
        throw new Error("Gagal membuat atau menemukan profil penyewa.");
      }

      // 3. Deactivate any previous active leases on this unit
      await tx.lease.updateMany({
        where: {
          unitId,
          status: LeaseStatus.ACTIVE,
        },
        data: {
          status: LeaseStatus.TERMINATED,
          endDate: new Date(),
        },
      });

      // 4. Create new Active Lease
      const startDate = input.checkInDate ? new Date(input.checkInDate) : new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year default lease period

      const rentPrice = input.monthlyRent !== undefined ? input.monthlyRent : Number(unit.basePrice);
      const securityDeposit = input.deposit !== undefined ? input.deposit : Number(unit.deposit);

      const newLease = await tx.lease.create({
        data: {
          unitId,
          tenantId: tenantProfileId,
          rentalPeriod: RentalPeriodType.MONTHLY,
          startDate,
          endDate,
          rentPrice,
          securityDeposit,
          status: LeaseStatus.ACTIVE,
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
        },
      });

      // 5. Update unit status to OCCUPIED
      await tx.unit.update({
        where: { id: unitId },
        data: {
          status: UnitStatus.OCCUPIED,
        },
      });

      return newLease;
    });
  }

  /**
   * Checkout tenant: Terminate active lease and reset unit status & password
   */
  static async checkoutTenant(unitId: string) {
    return prisma.$transaction(async (tx) => {
      const unit = await tx.unit.findUnique({
        where: { id: unitId },
        include: { property: true },
      });

      if (!unit) {
        throw new Error(`Unit dengan ID '${unitId}' tidak ditemukan.`);
      }

      // 1. Terminate all active leases for this unit
      await tx.lease.updateMany({
        where: {
          unitId,
          status: LeaseStatus.ACTIVE,
        },
        data: {
          status: LeaseStatus.TERMINATED,
          endDate: new Date(),
        },
      });

      // 2. Generate new room password for next tenant
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let rand = "";
      for (let i = 0; i < 6; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const newRoomPassword = `Arv!${rand}`;

      // 3. Determine next unit status based on property.hasCleaningService
      const hasCleaning = unit.property?.hasCleaningService ?? true;
      const nextStatus = hasCleaning ? UnitStatus.CLEANING : UnitStatus.AVAILABLE;

      // 4. Update unit
      const updatedUnit = await tx.unit.update({
        where: { id: unitId },
        data: {
          status: nextStatus,
          roomPassword: newRoomPassword,
          roomPasswordLastReset: new Date(),
        },
      });

      return {
        unit: updatedUnit,
        message: `Penyewa berhasil check-out. Status unit: ${nextStatus}. Password kamar telah di-reset.`,
      };
    });
  }
}
