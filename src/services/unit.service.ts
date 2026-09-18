import { prisma } from "@/lib/prisma";
import { LeaseStatus, RentalPeriodType, UnitStatus, UserRole } from "@/generated/prisma/client";
import { CommunityWelcomeService } from "./community-welcome.service";

export interface UnitFilterParams {
  propertyId?: string;
  propertyIds?: string[];
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
  inventoryIds?: string[];
  smartLockPin?: string;
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
    const isOccupiedUnit = unit.status === 'OCCUPIED' || Boolean(activeLease);
    const resolvedDeposit = Number(unit.deposit || activeLease?.securityDeposit || unit.property?.defaultDeposit || 0);
    return {
      id: unit.id,
      propertyId: unit.propertyId,
      propertyName: unit.property?.name,
      name: unit.unitNumber,
      unitNumber: unit.unitNumber,
      rawStatus: isOccupiedUnit ? 'OCCUPIED' : unit.status,
      floor: unit.floor,
      status: isOccupiedUnit ? 'Occupied' : (unit.status === 'CLEANING' ? 'Need Cleaning' : unit.status === 'AVAILABLE' ? 'Available' : unit.status === 'MAINTENANCE' ? 'Maintenance' : 'Reserved'),
      pricing: {
        monthly: Number(unit.basePrice || 0),
        daily: unit.transitPrice ? Number(unit.transitPrice) : undefined,
        deposit: resolvedDeposit,
      },
      capacity: {
        maxPersons: unit.capacity || 1,
        dimensions: unit.dimensions || '3x4 m',
      },
      facilities: unit.facilities || [],
      description: unit.description || '',
      imageUrl: unit.imageUrl || '',
      smartLockPin: unit.smartLockPin || undefined,
      roomEmail: unit.unitUser?.email || `${unit.unitNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@arventa.id`,
      roomPassword: unit.roomPassword || 'Arv!789210',
      roomPasswordLastReset: unit.roomPasswordLastReset?.toISOString?.() || (typeof unit.roomPasswordLastReset === 'string' ? unit.roomPasswordLastReset : unit.createdAt?.toISOString?.() || new Date().toISOString()),
      tenantName: isOccupiedUnit ? (activeLease?.tenant?.fullName || activeLease?.tenant?.user?.fullName || undefined) : undefined,
      tenantPhone: isOccupiedUnit ? (activeLease?.tenant?.phoneNumber || activeLease?.tenant?.user?.phoneNumber || undefined) : undefined,
      checkInDate: isOccupiedUnit && activeLease?.startDate ? (typeof activeLease.startDate === 'string' ? activeLease.startDate.split('T')[0] : activeLease.startDate.toISOString().split('T')[0]) : undefined,
      activeLease: isOccupiedUnit && activeLease ? {
        id: activeLease.id,
        contractNumber: (activeLease.contractUrl && !activeLease.contractUrl.startsWith('http'))
          ? activeLease.contractUrl
          : `KTR/ARV/${activeLease.id.slice(0, 6).toUpperCase()}`,
        contractUrl: activeLease.contractUrl && activeLease.contractUrl.startsWith('http') ? activeLease.contractUrl : undefined,
        startDate: activeLease.startDate ? (typeof activeLease.startDate === 'string' ? activeLease.startDate.split('T')[0] : activeLease.startDate.toISOString().split('T')[0]) : undefined,
        endDate: activeLease.endDate ? (typeof activeLease.endDate === 'string' ? activeLease.endDate.split('T')[0] : activeLease.endDate.toISOString().split('T')[0]) : undefined,
        status: activeLease.status || 'ACTIVE',
        rentPrice: Number(activeLease.rentPrice || unit.basePrice || 0),
        securityDeposit: Number(activeLease.securityDeposit || resolvedDeposit || 0),
        rentalPeriod: activeLease.rentalPeriod || 'MONTHLY',
      } : undefined,
      createdAt: typeof unit.createdAt === 'string' ? unit.createdAt : unit.createdAt.toISOString(),
      inventories: (unit.inventoryItems || unit.inventories || []).map((inv: any) => ({
        id: inv.id,
        propertyInventoryId: inv.propertyInventoryId || undefined,
        propertyId: unit.propertyId,
        unitId: inv.unitId,
        unitName: unit.unitNumber,
        name: inv.propertyInventory?.itemName || inv.itemName,
        itemName: inv.propertyInventory?.itemName || inv.itemName,
        quantity: inv.quantity,
        condition: inv.condition,
        imageUrl: inv.imageUrl || undefined,
        notes: inv.notes || undefined,
        lastUpdated: inv.updatedAt ? (typeof inv.updatedAt === 'string' ? inv.updatedAt : inv.updatedAt.toISOString()) : (typeof inv.createdAt === 'string' ? inv.createdAt : inv.createdAt.toISOString()),
      })),
    };
  }

  /**
   * Get all units with optional filters and active leases
   */
  static async getAllUnits(params: UnitFilterParams = {}) {
    const where: any = {};

    if (params.propertyId) {
      where.propertyId = params.propertyId;
    } else if (params.propertyIds !== undefined) {
      where.propertyId = { in: params.propertyIds };
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
            defaultDeposit: true,
            defaultLateFee: true,
          },
        },
        unitUser: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        inventoryItems: {
          include: {
            propertyInventory: true,
          },
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
            defaultDeposit: true,
            defaultLateFee: true,
            hasWifi: true,
            wifiSsid: true,
            wifiPassword: true,
            hasSmartLock: true,
          },
        },
        unitUser: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        inventoryItems: {
          include: {
            propertyInventory: true,
          },
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
    const resultUnitId = await prisma.$transaction(async (tx) => {
      // 1. Generate unique room account email & initial password scoped to property
      const property = await tx.property.findUnique({
        where: { id: data.propertyId },
        select: { id: true, name: true },
      });
      const cleanProp = property?.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || `p${data.propertyId.slice(0, 6)}`;
      const cleanNum = data.name.toLowerCase().replace(/[^a-z0-9]/g, '') || `u${Date.now()}`;
      let roomEmail = `${cleanNum}.${cleanProp}@arventa.id`;

      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let rand = "";
      for (let i = 0; i < 6; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const initialPassword = `Arv!${rand}`;

      // Check if user with this room email exists
      let roomUser = await tx.user.findUnique({
        where: { email: roomEmail },
        include: { unitAccount: true },
      });

      // If user exists and is already linked to another unit, append random suffix to guarantee a distinct account
      if (roomUser && roomUser.unitAccount) {
        const extraRand = Math.random().toString(36).substring(2, 6);
        roomEmail = `${cleanNum}.${cleanProp}.${extraRand}@arventa.id`;
        roomUser = await tx.user.findUnique({
          where: { email: roomEmail },
          include: { unitAccount: true },
        });
      }

      if (!roomUser) {
        roomUser = await tx.user.create({
          data: {
            fullName: `Akun Unit ${data.name}`,
            email: roomEmail,
            role: UserRole.TENANT,
            phoneNumber: '0812' + Math.floor(10000000 + Math.random() * 90000000),
            isActive: true,
          },
          include: { unitAccount: true },
        });
      } else if (roomUser.role !== UserRole.TENANT) {
        await tx.user.update({
          where: { id: roomUser.id },
          data: { role: UserRole.TENANT },
        });
      }

      // Upsert UserCredential for direct password login
      await tx.userCredential.upsert({
        where: { userId: roomUser.id },
        update: { rawPassword: initialPassword },
        create: { userId: roomUser.id, rawPassword: initialPassword },
      });

      // Cek fitur WiFi dan Smart Lock pada properti induk
      const parentProp = await tx.property.findUnique({
        where: { id: data.propertyId },
        include: { inventories: true },
      });

      const resolvedFacilities = Array.isArray(data.facilities) ? [...data.facilities] : [];
      if ((parentProp?.hasSmartLock || data.smartLockPin) && !resolvedFacilities.some((f) => f.toLowerCase().includes('smart lock'))) {
        resolvedFacilities.push('Smart Lock Pintu');
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
          facilities: resolvedFacilities,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          roomPassword: initialPassword,
          roomPasswordLastReset: new Date(),
          smartLockPin: data.smartLockPin || null,
        },
        include: {
          property: true,
          unitUser: true,
        },
      });

      // 3. If master inventoryIds provided or Smart Lock enabled, sync UnitInventory records
      const syncInventoryIds = Array.isArray(data.inventoryIds) ? [...data.inventoryIds] : [];

      if (parentProp?.hasSmartLock || data.smartLockPin) {
        let lockMaster = parentProp?.inventories?.find((i) => i.itemName.toLowerCase().includes('smart lock'));
        if (!lockMaster) {
          lockMaster = await tx.propertyInventory.create({
            data: {
              propertyId: data.propertyId,
              itemName: 'Smart Lock Pintu',
              locationType: 'UNIT',
              quantity: 1,
              condition: 'Baik',
              notes: 'Fasilitas Kunci Digital Smart Lock Pintu Unit',
            },
          });
        }
        if (lockMaster && !syncInventoryIds.includes(lockMaster.id)) {
          syncInventoryIds.push(lockMaster.id);
        }
      }

      if (syncInventoryIds.length > 0) {
        const uniqueIds = Array.from(new Set(syncInventoryIds));
        const masterItems = await tx.propertyInventory.findMany({
          where: { id: { in: uniqueIds } },
        });
        for (const master of masterItems) {
          await tx.unitInventory.create({
            data: {
              unitId: unit.id,
              propertyInventoryId: master.id,
              itemName: master.itemName,
              condition: master.condition || "Baik",
              quantity: 1,
            },
          });
        }
      }

      // 4. If tenantName is provided on create, create active lease
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

      return unit.id;
    }, {
      maxWait: 10000,
      timeout: 25000,
    });

    const result = await this.getUnitById(resultUnitId);

    // Auto Welcome Post & SYSTEM_JOIN if tenant assigned
    const createdUnitNumber = (result as any)?.name || (result as any)?.unitNumber || "";
    if (data.tenantName && result?.propertyId && createdUnitNumber) {
      import("./property-chat.service").then(({ PropertyChatService }) => {
        PropertyChatService.sendSystemJoinMessage({
          propertyId: result.propertyId,
          tenantName: data.tenantName!,
          unitNumber: createdUnitNumber,
        }).catch((e) => console.error("Auto chat join event error in createUnit:", e));
      });

      CommunityWelcomeService.createWelcomePost({
        propertyId: result.propertyId,
        unitNumber: createdUnitNumber,
        tenantName: data.tenantName,
        checkInDate: data.checkInDate,
      }).catch((e) => console.error("Auto welcome post error:", e));
    }

    return result;
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
    const updatedUnitId = await prisma.$transaction(async (tx) => {
      if (data.status && data.status !== 'OCCUPIED') {
        await tx.lease.updateMany({
          where: { unitId: id, status: LeaseStatus.ACTIVE },
          data: { status: LeaseStatus.TERMINATED },
        });
      }

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
          ...(data.smartLockPin !== undefined && { smartLockPin: data.smartLockPin || null }),
        },
      });

      // Sync UnitInventory relations if inventoryIds passed
      if (data.inventoryIds && Array.isArray(data.inventoryIds)) {
        await tx.unitInventory.deleteMany({
          where: { unitId: id },
        });
        const uniqueIds = Array.from(new Set(data.inventoryIds));
        if (uniqueIds.length > 0) {
          const masterItems = await tx.propertyInventory.findMany({
            where: { id: { in: uniqueIds } },
          });
          for (const master of masterItems) {
            await tx.unitInventory.create({
              data: {
                unitId: id,
                propertyInventoryId: master.id,
                itemName: master.itemName,
                condition: master.condition || "Baik",
                quantity: 1,
              },
            });
          }
        }
      }

      return updated.id;
    });

    const result = await this.getUnitById(id);

    const updatedUnitNumber = (result as any)?.name || (result as any)?.unitNumber || "";
    if (data.tenantName && result?.propertyId && updatedUnitNumber) {
      CommunityWelcomeService.createWelcomePost({
        propertyId: result.propertyId,
        unitNumber: updatedUnitNumber,
        tenantName: data.tenantName,
        checkInDate: data.checkInDate,
      }).catch((e) => console.error("Auto welcome post error:", e));
    }

    return result;
  }

  /**
   * Bulk action on multiple units
   */
  static async bulkAction(input: BulkActionInput) {
    const { unitIds, actionType } = input;
    if (!unitIds || unitIds.length === 0) return { count: 0 };

    if (actionType === 'delete') {
      const unitsToDelete = await prisma.unit.findMany({
        where: { id: { in: unitIds } },
        select: { id: true, unitUserId: true },
      });

      const userIdsToDelete = unitsToDelete
        .map((u) => u.unitUserId)
        .filter((uid): uid is string => Boolean(uid));

      await prisma.unit.deleteMany({
        where: { id: { in: unitIds } },
      });

      if (userIdsToDelete.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: userIdsToDelete } },
        }).catch(() => null);
      }

      return { count: unitsToDelete.length };
    }

    if (actionType === 'status' && input.newStatus) {
      if (input.newStatus !== 'OCCUPIED') {
        await prisma.lease.updateMany({
          where: { unitId: { in: unitIds }, status: LeaseStatus.ACTIVE },
          data: { status: LeaseStatus.TERMINATED },
        });
      }
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
   * Reset room credentials password (supports custom manual password or auto-generated)
   */
  static async resetRoomPassword(id: string, customPassword?: string) {
    let newPassword = customPassword?.trim();
    if (!newPassword) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let rand = "";
      for (let i = 0; i < 6; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      newPassword = `Arv!${rand}`;
    }

    const updated = await prisma.unit.update({
      where: { id },
      data: {
        roomPassword: newPassword,
        roomPasswordLastReset: new Date(),
      },
      include: {
        unitUser: true,
      },
    });

    if (updated.unitUser) {
      await prisma.userCredential.upsert({
        where: { userId: updated.unitUser.id },
        update: { rawPassword: newPassword },
        create: { userId: updated.unitUser.id, rawPassword: newPassword },
      }).catch((e) => console.warn("Failed to update userCredential on resetRoomPassword:", e));

      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseServiceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
          const { createClient: createSupabaseAdmin } = await import("@supabase/supabase-js");
          const supabaseAdmin = createSupabaseAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseServiceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
          );

          if (updated.unitUser.supabaseAuthId) {
            await supabaseAdmin.auth.admin.updateUserById(updated.unitUser.supabaseAuthId, {
              password: newPassword,
              email_confirm: true,
            });
          } else {
            const { data: createData } = await supabaseAdmin.auth.admin.createUser({
              email: updated.unitUser.email,
              password: newPassword,
              email_confirm: true,
              user_metadata: { full_name: updated.unitUser.fullName, role: updated.unitUser.role },
            });
            if (createData?.user) {
              await prisma.user.update({
                where: { id: updated.unitUser.id },
                data: { supabaseAuthId: createData.user.id },
              });
            }
          }
        } catch (err) {
          console.warn("⚠️ Failed to sync reset password to Supabase Auth:", err);
        }
      }
    }

    return {
      newPassword,
      roomPasswordLastReset: updated.roomPasswordLastReset,
    };
  }
}
