import { prisma } from "@/lib/prisma";
import { RentalPeriodType, UnitStatus, UserRole } from "@/generated/prisma/client";

export interface UnitFilterParams {
  propertyId?: string;
  status?: UnitStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateUnitData {
  propertyId: string;
  name: string; // e.g. "Kamar 101"
  floor?: number;
  status?: UnitStatus;
  allowedPeriod?: RentalPeriodType;
  basePrice: number;
  transitPrice?: number;
  deposit?: number;
  capacity?: number;
  dimensions?: string;
  facilities?: string[];
  description?: string;
  imageUrl?: string;
  tenantName?: string;
  tenantPhone?: string;
  checkInDate?: string;
}

export interface BulkActionInput {
  unitIds: string[];
  actionType: 'status' | 'facilities' | 'pricing' | 'delete';
  newStatus?: UnitStatus;
  facilityOperation?: 'add' | 'remove';
  facilitiesToApply?: string[];
  priceAdjustmentType?: 'set' | 'flat_increase' | 'flat_decrease' | 'percent_increase' | 'percent_decrease';
  priceValue?: number;
}

export class UnitService {
  /**
   * Helper to format a DB Unit record with UI friendly fields
   */
  static formatUnit(unit: any) {
    const activeLease = unit.leases?.[0];
    return {
      id: unit.id,
      propertyId: unit.propertyId,
      propertyName: unit.property?.name,
      name: unit.unitNumber,
      floor: unit.floor,
      status: unit.status === 'CLEANING' ? 'Need Cleaning' : unit.status === 'AVAILABLE' ? 'Available' : unit.status === 'OCCUPIED' ? 'Occupied' : unit.status === 'MAINTENANCE' ? 'Maintenance' : 'Reserved',
      pricing: {
        monthly: Number(unit.basePrice || 0),
        daily: unit.transitPrice ? Number(unit.transitPrice) : undefined,
        deposit: Number(unit.deposit || 0),
      },
      capacity: {
        maxPersons: unit.capacity || 1,
        dimensions: unit.dimensions || '3x4 m',
      },
      facilities: unit.facilities || [],
      description: unit.description || '',
      imageUrl: unit.imageUrl || '',
      roomEmail: unit.unitUser?.email || `${unit.unitNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@arventa.id`,
      roomPassword: unit.roomPassword || 'Arv!789210',
      roomPasswordLastReset: unit.roomPasswordLastReset?.toISOString() || unit.createdAt.toISOString(),
      tenantName: activeLease?.tenant?.user?.fullName || undefined,
      tenantPhone: activeLease?.tenant?.user?.phoneNumber || undefined,
      checkInDate: activeLease?.startDate ? activeLease.startDate.toISOString().split('T')[0] : undefined,
      createdAt: unit.createdAt.toISOString(),
    };
  }

  /**
   * Get all units with optional filters and active leases
   */
  static async getAllUnits(params: UnitFilterParams = {}) {
    const where: any = {};

    if (params.propertyId) {
      where.propertyId = params.propertyId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      where.OR = [
        { unitNumber: { contains: params.search, mode: 'insensitive' } },
        { property: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const units = await prisma.unit.findMany({
      where,
      orderBy: [{ floor: 'asc' }, { unitNumber: 'asc' }],
      include: {
        property: {
          select: {
            id: true,
            name: true,
            hasCleaningService: true,
          },
        },
        unitUser: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        leases: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: {
            tenant: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return units.map(this.formatUnit);
  }

  /**
   * Get single unit detail by ID
   */
  static async getUnitById(id: string) {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            hasCleaningService: true,
          },
        },
        unitUser: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        inventories: {
          orderBy: { createdAt: 'desc' },
        },
        leases: {
          where: { status: 'ACTIVE' },
          take: 1,
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
        },
      },
    });

    if (!unit) return null;
    return this.formatUnit(unit);
  }

  /**
   * Create a single unit and auto-generate its dedicated room user account (1 Kamar 1 Akun)
   */
  static async createUnit(data: CreateUnitData) {
    return prisma.$transaction(async (tx) => {
      // 1. Generate unique room account email & initial password
      const cleanNum = data.name.toLowerCase().replace(/[^a-z0-9]/g, '') || `u${Date.now()}`;
      const roomEmail = `${cleanNum}@arventa.id`;
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let rand = "";
      for (let i = 0; i < 6; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const initialPassword = `Arv!${rand}`;

      // Check if user with this room email exists, otherwise create
      let roomUser = await tx.user.findUnique({
        where: { email: roomEmail },
      });

      if (!roomUser) {
        roomUser = await tx.user.create({
          data: {
            fullName: `Unit ${data.name}`,
            email: roomEmail,
            role: UserRole.USER,
          },
        });
      }

      // 2. Create Unit
      const unit = await tx.unit.create({
        data: {
          propertyId: data.propertyId,
          unitUserId: roomUser.id,
          unitNumber: data.name,
          floor: data.floor || 1,
          status: data.status || UnitStatus.AVAILABLE,
          allowedPeriod: data.allowedPeriod || RentalPeriodType.MONTHLY,
          basePrice: data.basePrice,
          transitPrice: data.transitPrice || null,
          deposit: data.deposit || 0,
          capacity: data.capacity || 1,
          dimensions: data.dimensions || "3x4 m",
          facilities: data.facilities || [],
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          roomPassword: initialPassword,
          roomPasswordLastReset: new Date(),
        },
        include: {
          property: true,
          unitUser: true,
        },
      });

      // 3. If tenantName is provided on create, create active lease
      if (data.tenantName) {
        const tenantEmail = `tenant.${Date.now()}@tenant.arventa.id`;
        const tenantUser = await tx.user.create({
          data: {
            fullName: data.tenantName.trim(),
            phoneNumber: data.tenantPhone || null,
            email: tenantEmail,
            role: UserRole.TENANT,
            tenantProfile: { create: {} },
          },
          include: { tenantProfile: true },
        });

        if (tenantUser.tenantProfile) {
          const startDate = data.checkInDate ? new Date(data.checkInDate) : new Date();
          const endDate = new Date(startDate);
          endDate.setFullYear(endDate.getFullYear() + 1);

          await tx.lease.create({
            data: {
              unitId: unit.id,
              tenantId: tenantUser.tenantProfile.id,
              rentalPeriod: RentalPeriodType.MONTHLY,
              startDate,
              endDate,
              rentPrice: data.basePrice,
              securityDeposit: data.deposit || 0,
              status: 'ACTIVE',
            },
          });

          await tx.unit.update({
            where: { id: unit.id },
            data: { status: UnitStatus.OCCUPIED },
          });
        }
      }

      return this.getUnitById(unit.id);
    });
  }

  /**
   * Batch create multiple units for a property
   */
  static async createBatchUnits(propertyId: string, batchData: CreateUnitData[]) {
    const createdUnits = [];
    for (const item of batchData) {
      const u = await this.createUnit({ ...item, propertyId });
      createdUnits.push(u);
    }
    return createdUnits;
  }

  /**
   * Update existing unit
   */
  static async updateUnit(id: string, data: Partial<CreateUnitData>) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.unit.update({
        where: { id },
        data: {
          ...(data.name && { unitNumber: data.name }),
          ...(data.floor !== undefined && { floor: data.floor }),
          ...(data.status && { status: data.status }),
          ...(data.allowedPeriod && { allowedPeriod: data.allowedPeriod }),
          ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
          ...(data.transitPrice !== undefined && { transitPrice: data.transitPrice }),
          ...(data.deposit !== undefined && { deposit: data.deposit }),
          ...(data.capacity !== undefined && { capacity: data.capacity }),
          ...(data.dimensions !== undefined && { dimensions: data.dimensions }),
          ...(data.facilities !== undefined && { facilities: data.facilities }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        },
      });

      return this.getUnitById(updated.id);
    });
  }

  /**
   * Bulk action on multiple units
   */
  static async bulkAction(input: BulkActionInput) {
    const { unitIds, actionType } = input;
    if (!unitIds || unitIds.length === 0) return { count: 0 };

    if (actionType === 'delete') {
      return prisma.unit.deleteMany({
        where: { id: { in: unitIds } },
      });
    }

    if (actionType === 'status' && input.newStatus) {
      return prisma.unit.updateMany({
        where: { id: { in: unitIds } },
        data: { status: input.newStatus },
      });
    }

    if (actionType === 'pricing' && input.priceAdjustmentType && input.priceValue !== undefined) {
      const { priceAdjustmentType, priceValue } = input;
      const targetUnits = await prisma.unit.findMany({
        where: { id: { in: unitIds } },
      });

      for (const u of targetUnits) {
        let currentPrice = Number(u.basePrice);
        let newPrice = currentPrice;

        if (priceAdjustmentType === 'set') {
          newPrice = priceValue;
        } else if (priceAdjustmentType === 'flat_increase') {
          newPrice = Math.max(0, currentPrice + priceValue);
        } else if (priceAdjustmentType === 'flat_decrease') {
          newPrice = Math.max(0, currentPrice - priceValue);
        } else if (priceAdjustmentType === 'percent_increase') {
          newPrice = Math.max(0, Math.round(currentPrice * (1 + priceValue / 100)));
        } else if (priceAdjustmentType === 'percent_decrease') {
          newPrice = Math.max(0, Math.round(currentPrice * (1 - priceValue / 100)));
        }

        await prisma.unit.update({
          where: { id: u.id },
          data: { basePrice: newPrice },
        });
      }

      return { count: targetUnits.length };
    }

    if (actionType === 'facilities' && input.facilitiesToApply && input.facilityOperation) {
      const { facilityOperation, facilitiesToApply } = input;
      const targetUnits = await prisma.unit.findMany({
        where: { id: { in: unitIds } },
      });

      for (const u of targetUnits) {
        let facs = [...u.facilities];
        if (facilityOperation === 'add') {
          const toAdd = facilitiesToApply.filter((f) => !facs.includes(f));
          facs = [...facs, ...toAdd];
        } else if (facilityOperation === 'remove') {
          facs = facs.filter((f) => !facilitiesToApply.includes(f));
        }

        await prisma.unit.update({
          where: { id: u.id },
          data: { facilities: facs },
        });
      }

      return { count: targetUnits.length };
    }

    return { count: 0 };
  }

  /**
   * Delete single unit
   */
  static async deleteUnit(id: string) {
    const unit = await prisma.unit.findUnique({
      where: { id },
      select: { unitUserId: true },
    });

    await prisma.unit.delete({
      where: { id },
    });

    if (unit?.unitUserId) {
      await prisma.user.delete({
        where: { id: unit.unitUserId },
      }).catch(() => null);
    }

    return { success: true };
  }

  /**
   * Reset room credentials password
   */
  static async resetRoomPassword(id: string) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let rand = "";
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newPassword = `Arv!${rand}`;

    const updated = await prisma.unit.update({
      where: { id },
      data: {
        roomPassword: newPassword,
        roomPasswordLastReset: new Date(),
      },
    });

    return {
      newPassword,
      roomPasswordLastReset: updated.roomPasswordLastReset,
    };
  }
}
