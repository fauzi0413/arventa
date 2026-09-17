import { prisma } from "@/lib/prisma";
import { PropertyType, UserRole } from "@/generated/prisma/client";
import { CreatePropertyInput, UpdatePropertyInput } from "@/lib/validations/property.schema";

export interface PropertyFilterParams {
  search?: string;
  type?: PropertyType;
  city?: string;
  ownerId?: string;
  propertyIds?: string[];
  page?: number;
  limit?: number;
}

/**
 * Property Service Layer
 * Encapsulates Prisma queries and business logic for properties.
 */
export class PropertyService {
  /**
   * Get paginated & filtered list of properties
   */
  static async getAllProperties(params: PropertyFilterParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { address: { contains: params.search, mode: "insensitive" } },
        { city: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.city) {
      where.city = { contains: params.city, mode: "insensitive" };
    }

    if (params.ownerId) {
      where.ownerId = params.ownerId;
    }

    if (params.propertyIds !== undefined) {
      where.id = { in: params.propertyIds };
    }

    const [items, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
          units: {
            select: {
              id: true,
              unitNumber: true,
              status: true,
              basePrice: true,
              transitPrice: true,
              deposit: true,
              capacity: true,
              dimensions: true,
              facilities: true,
              description: true,
              floor: true,
              leases: {
                where: { status: 'ACTIVE' },
                take: 1,
                include: {
                  tenant: {
                    include: {
                      user: {
                        select: {
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
            orderBy: {
              unitNumber: "asc",
            },
          },
          _count: {
            select: {
              units: true,
              expenses: true,
            },
          },
        },
      }),
      prisma.property.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get property detail by ID with complete inventory allocations, payment methods & unit stats
   */
  static async getPropertyById(id: string) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            ownerPaymentMethods: {
              where: { isEnabled: true },
            },
          },
        },
        paymentMethods: {
          where: { isEnabled: true },
        },
        housekeepingAssignments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                avatarUrl: true,
                isActive: true,
              },
            },
          },
        },
        inventories: {
          include: {
            unitInventories: {
              select: {
                id: true,
                quantity: true,
                unit: {
                  select: {
                    id: true,
                    unitNumber: true,
                  },
                },
              },
            },
          },
          orderBy: { itemName: "asc" },
        },
        units: {
          orderBy: { unitNumber: "asc" },
          include: {
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
              orderBy: { createdAt: "desc" },
            },
            leases: {
              where: { status: 'ACTIVE' },
              take: 1,
              include: {
                tenant: {
                  include: {
                    user: {
                      select: {
                        fullName: true,
                        phoneNumber: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
            _count: {
              select: {
                inventoryItems: true,
                leases: true,
              },
            },
          },
        },
        _count: {
          select: {
            expenses: true,
            units: true,
          },
        },
      },
    });

    if (!property) return null;

    // Enrich inventory master items with allocation summaries (terpasang di kamar vs sisa stok)
    const enrichedInventories = property.inventories.map((inv) => {
      const allocatedQuantity = inv.unitInventories.reduce((sum, u) => sum + (u.quantity || 1), 0);
      const availableQuantity = Math.max(0, inv.quantity - allocatedQuantity);
      return {
        ...inv,
        allocatedQuantity,
        availableQuantity,
        isOverallocated: allocatedQuantity > inv.quantity,
        installedUnits: inv.unitInventories
          .map((u) => u.unit?.unitNumber)
          .filter((num): num is string => Boolean(num)),
      };
    });

    // Format units with tenant details & inventories fallback
    const formattedUnits = property.units.map((u) => {
      const activeLease = u.leases?.[0];
      const isOccupiedUnit = u.status === 'OCCUPIED' || Boolean(activeLease);
      const resolvedDeposit = Number(u.deposit || activeLease?.securityDeposit || property.defaultDeposit || 0);

      return {
        id: u.id,
        propertyId: property.id,
        propertyName: property.name,
        name: u.unitNumber,
        unitNumber: u.unitNumber,
        rawStatus: isOccupiedUnit ? 'OCCUPIED' : u.status,
        floor: u.floor,
        status: isOccupiedUnit
          ? 'Occupied'
          : (u.status === 'CLEANING' ? 'Need Cleaning' : u.status === 'AVAILABLE' ? 'Available' : u.status === 'MAINTENANCE' ? 'Maintenance' : 'Reserved'),
        pricing: {
          monthly: Number(u.basePrice || 0),
          daily: u.transitPrice ? Number(u.transitPrice) : undefined,
          deposit: resolvedDeposit,
        },
        capacity: {
          maxPersons: u.capacity || 1,
          dimensions: u.dimensions || '3x4 m',
        },
        facilities: u.facilities || [],
        description: u.description || '',
        imageUrl: u.imageUrl || '',
        roomEmail: u.unitUser?.email || `${u.unitNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@arventa.id`,
        roomPassword: u.roomPassword || 'Arv!789210',
        roomPasswordLastReset: u.roomPasswordLastReset?.toISOString() || u.createdAt.toISOString(),
        tenantName: isOccupiedUnit
          ? (activeLease?.tenant?.user?.fullName || activeLease?.tenant?.fullName || undefined)
          : undefined,
        tenantPhone: isOccupiedUnit
          ? (activeLease?.tenant?.user?.phoneNumber || activeLease?.tenant?.phoneNumber || undefined)
          : undefined,
        checkInDate: isOccupiedUnit && activeLease?.startDate
          ? activeLease.startDate.toISOString().split('T')[0]
          : undefined,
        activeLease: isOccupiedUnit && activeLease ? {
          id: activeLease.id,
          contractNumber: (activeLease.contractUrl && !activeLease.contractUrl.startsWith('http'))
            ? activeLease.contractUrl
            : `KTR/ARV/${activeLease.id.slice(0, 6).toUpperCase()}`,
          contractUrl: activeLease.contractUrl && activeLease.contractUrl.startsWith('http') ? activeLease.contractUrl : undefined,
          startDate: activeLease.startDate ? activeLease.startDate.toISOString().split('T')[0] : undefined,
          endDate: activeLease.endDate ? activeLease.endDate.toISOString().split('T')[0] : undefined,
          status: activeLease.status || 'ACTIVE',
          rentPrice: Number(activeLease.rentPrice || u.basePrice || 0),
          securityDeposit: Number(activeLease.securityDeposit || resolvedDeposit || 0),
          rentalPeriod: activeLease.rentalPeriod || 'MONTHLY',
        } : undefined,
        inventories: (u.inventoryItems || []).map((inv) => ({
          id: inv.id,
          propertyInventoryId: inv.propertyInventoryId || undefined,
          propertyId: property.id,
          unitId: u.id,
          unitName: u.unitNumber,
          name: inv.propertyInventory?.itemName || inv.itemName,
          itemName: inv.propertyInventory?.itemName || inv.itemName,
          quantity: inv.quantity,
          condition: inv.condition,
          notes: inv.notes || undefined,
        })),
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      };
    });

    // Compute unit occupancy stats
    const totalUnits = formattedUnits.length;
    const occupiedUnits = formattedUnits.filter((u) => u.status === 'Occupied').length;
    const availableUnits = formattedUnits.filter((u) => u.status === 'Available').length;

    return {
      ...property,
      owner: property.owner ? {
        ...property.owner,
        paymentMethods: property.owner.ownerPaymentMethods || [],
      } : null,
      housekeepingStaff: (property.housekeepingAssignments || []).map((a) => ({
        id: a.user.id,
        assignmentId: a.id,
        fullName: a.user.fullName,
        email: a.user.email,
        phoneNumber: a.user.phoneNumber || "-",
        avatarUrl: a.user.avatarUrl,
        isActive: a.user.isActive,
      })),
      inventories: enrichedInventories,
      units: formattedUnits,
      stats: {
        totalUnits,
        occupiedUnits,
        availableUnits,
        occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
      },
    };
  }

  /**
   * Create a new property
   */
  static async createProperty(data: CreatePropertyInput) {
    if (!data.ownerId) {
      throw new Error("Owner ID wajib diisi untuk membuat properti");
    }

    const totalUnitsCount = Math.max(0, Number(data.totalUnits) || 0);

    return prisma.$transaction(async (tx) => {
      const newProperty = await tx.property.create({
        data: {
          ownerId: data.ownerId!,
          name: data.name,
          type: (data.type as any === "KOST" ? PropertyType.KOS : data.type) || PropertyType.KOS,
          address: data.address,
          city: data.city || "Jakarta",
          description: data.description || "",
          coverImage: data.coverImage || "",
          hasCleaningService: data.hasCleaningService ?? true,
          defaultLateFee: data.defaultLateFee ?? 50000,
          defaultDeposit: data.defaultDeposit ?? 0,
          hasWifi: data.hasWifi ?? false,
          wifiSsid: data.hasWifi ? (data.wifiSsid || null) : null,
          wifiPassword: data.hasWifi ? (data.wifiPassword || null) : null,
          hasSmartLock: data.hasSmartLock ?? false,
        },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      // If totalUnits specified, automatically create initial room units with dedicated room accounts & credentials
      if (totalUnitsCount > 0) {
        const cleanProp = newProperty.name.toLowerCase().replace(/[^a-z0-9]/g, "") || `p${newProperty.id.slice(0, 6)}`;
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        for (let idx = 0; idx < totalUnitsCount; idx++) {
          const roomNum = idx + 1;
          const formattedNumber =
            data.type === "APARTEMEN"
              ? `Unit ${roomNum < 10 ? "0" + roomNum : roomNum}`
              : data.type === "RUKO"
              ? `Ruko Blok ${String.fromCharCode(65 + Math.floor(idx / 10))}-${(idx % 10) + 1}`
              : `Kamar ${100 + roomNum}`;

          const cleanNum = formattedNumber.toLowerCase().replace(/[^a-z0-9]/g, "") || `u${roomNum}`;
          let roomEmail = `${cleanNum}.${cleanProp}@arventa.id`;

          // Generate strong initial password
          let rand = "";
          for (let i = 0; i < 6; i++) {
            rand += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          const initialPassword = `Arv!${rand}`;

          // Check if user already exists
          let roomUser = await tx.user.findUnique({
            where: { email: roomEmail },
            include: { unitAccount: true },
          });

          // If user exists and is already assigned to a unit, append random suffix to avoid unique constraint collision
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
                fullName: `Akun Unit ${formattedNumber}`,
                email: roomEmail,
                role: UserRole.TENANT,
                phoneNumber: "0812" + Math.floor(10000000 + Math.random() * 90000000),
                isActive: true,
              },
              include: { unitAccount: true },
            });
          }

          // Create or update UserCredential record with rawPassword for login authentication
          await tx.userCredential.upsert({
            where: { userId: roomUser.id },
            update: { rawPassword: initialPassword },
            create: { userId: roomUser.id, rawPassword: initialPassword },
          });

          // Create Unit linked to roomUser
          await tx.unit.create({
            data: {
              propertyId: newProperty.id,
              unitUserId: roomUser.id,
              unitNumber: formattedNumber,
              floor: Math.floor(idx / 10) + 1,
              status:
                data.occupiedUnits && idx < data.occupiedUnits
                  ? ("OCCUPIED" as const)
                  : ("AVAILABLE" as const),
              basePrice: 1500000,
              deposit: data.defaultDeposit ?? 0,
              capacity: 1,
              dimensions: "3x4 m",
              facilities: ["WiFi", "Kasur", "Lemari", "Kamar Mandi Dalam"],
              description: `${newProperty.name} - ${formattedNumber}`,
              roomPassword: initialPassword,
              roomPasswordLastReset: new Date(),
            },
          });
        }
      }

      // Otomatis sinkronkan fasilitas ke Master Inventaris Properti (PropertyInventory) jika dipilih YA (true)
      if (data.hasWifi) {
        await tx.propertyInventory.create({
          data: {
            propertyId: newProperty.id,
            itemName: 'WiFi',
            locationType: 'COMMON_AREA',
            quantity: 1,
            condition: 'Baik',
            notes: data.wifiSsid ? `SSID: ${data.wifiSsid}` : 'Fasilitas Akses Internet WiFi',
          },
        });
      }

      if (data.hasSmartLock) {
        await tx.propertyInventory.create({
          data: {
            propertyId: newProperty.id,
            itemName: 'Smart Lock Pintu',
            locationType: 'UNIT',
            quantity: Math.max(1, totalUnitsCount),
            condition: 'Baik',
            notes: 'Fasilitas Kunci Digital Smart Lock Pintu Unit',
          },
        });
      }

      return newProperty;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });
  }

  /**
   * Update existing property
   */
  static async updateProperty(id: string, data: UpdatePropertyInput) {
    const updated = await prisma.property.update({
      where: { id },
      data: {
        ...(data.ownerId && { ownerId: data.ownerId }),
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type as PropertyType }),
        ...(data.address && { address: data.address }),
        ...(data.city && { city: data.city }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(data.hasCleaningService !== undefined && { hasCleaningService: data.hasCleaningService }),
        ...(data.defaultLateFee !== undefined && { defaultLateFee: data.defaultLateFee }),
        ...(data.defaultDeposit !== undefined && { defaultDeposit: data.defaultDeposit }),
        ...(data.hasWifi !== undefined && { hasWifi: data.hasWifi }),
        ...(data.hasWifi !== undefined && !data.hasWifi && { wifiSsid: null, wifiPassword: null }),
        ...(data.hasWifi && data.wifiSsid !== undefined && { wifiSsid: data.wifiSsid || null }),
        ...(data.hasWifi && data.wifiPassword !== undefined && { wifiPassword: data.wifiPassword || null }),
        ...(data.hasSmartLock !== undefined && { hasSmartLock: data.hasSmartLock }),
      },
      include: {
        units: true,
      },
    });

    // ==========================================
    // 1. SINKRONISASI FASILITAS WIFI
    // ==========================================
    if (data.hasWifi === true) {
      const existingWifi = await prisma.propertyInventory.findFirst({
        where: {
          propertyId: id,
          itemName: { in: ['WiFi', 'WiFi Bersama', 'Internet WiFi'] },
        },
      });
      if (!existingWifi) {
        await prisma.propertyInventory.create({
          data: {
            propertyId: id,
            itemName: 'WiFi',
            locationType: 'COMMON_AREA',
            quantity: 1,
            condition: 'Baik',
            notes: data.wifiSsid ? `SSID: ${data.wifiSsid}` : 'Fasilitas Akses Internet WiFi',
          },
        });
      } else if (data.wifiSsid) {
        await prisma.propertyInventory.update({
          where: { id: existingWifi.id },
          data: { notes: `SSID: ${data.wifiSsid}` },
        });
      }

      // WiFi adalah fasilitas Area Bersama (COMMON_AREA) properti, bukan fasilitas internal unit
      if (updated.units && updated.units.length > 0) {
        for (const u of updated.units) {
          const facList = Array.isArray(u.facilities) ? [...u.facilities] : [];
          const filtered = facList.filter((f) => f.toLowerCase() !== 'wifi');
          if (filtered.length !== facList.length) {
            await prisma.unit.update({
              where: { id: u.id },
              data: { facilities: filtered },
            });
          }
        }
      }
    } else if (data.hasWifi === false) {
      // JIKA FALSE: Hapus fasilitas WiFi dari Master Inventaris Fasilitas
      const wifiItems = await prisma.propertyInventory.findMany({
        where: {
          propertyId: id,
          itemName: { in: ['WiFi', 'WiFi Bersama', 'Internet WiFi'] },
        },
        select: { id: true },
      });
      if (wifiItems.length > 0) {
        const wifiIds = wifiItems.map((w) => w.id);
        await prisma.unitInventory.deleteMany({
          where: { propertyInventoryId: { in: wifiIds } },
        });
        await prisma.propertyInventory.deleteMany({
          where: { id: { in: wifiIds } },
        });
      }

      // Hapus 'WiFi' dari facilities pada semua unit di properti ini
      if (updated.units && updated.units.length > 0) {
        for (const u of updated.units) {
          const facList = Array.isArray(u.facilities) ? [...u.facilities] : [];
          if (facList.some((f) => f.toLowerCase() === 'wifi')) {
            const filteredFacs = facList.filter((f) => f.toLowerCase() !== 'wifi');
            await prisma.unit.update({
              where: { id: u.id },
              data: { facilities: filteredFacs },
            });
          }
        }
      }
    }

    // ==========================================
    // 2. SINKRONISASI FASILITAS SMART LOCK
    // ==========================================
    if (data.hasSmartLock === true) {
      const existingLock = await prisma.propertyInventory.findFirst({
        where: {
          propertyId: id,
          itemName: { in: ['Smart Lock', 'Smart Lock Pintu', 'Smart Lock Pintu Unit'] },
        },
      });
      const totalUnits = updated.units?.length || 1;
      let masterLockId = existingLock?.id;

      if (!existingLock) {
        const newLock = await prisma.propertyInventory.create({
          data: {
            propertyId: id,
            itemName: 'Smart Lock Pintu',
            locationType: 'UNIT',
            quantity: Math.max(1, totalUnits),
            condition: 'Baik',
            notes: 'Fasilitas Kunci Digital Smart Lock Pintu Unit',
          },
        });
        masterLockId = newLock.id;
      } else {
        await prisma.propertyInventory.update({
          where: { id: existingLock.id },
          data: { quantity: Math.max(existingLock.quantity, totalUnits) },
        });
      }

      // Otomatis tambahkan 'Smart Lock Pintu' ke fasilitas & unit inventory untuk unit di properti ini
      if (updated.units && updated.units.length > 0) {
        for (const u of updated.units) {
          const facList = Array.isArray(u.facilities) ? [...u.facilities] : [];
          if (!facList.some((f) => f.toLowerCase().includes('smart lock'))) {
            facList.push('Smart Lock Pintu');
            await prisma.unit.update({
              where: { id: u.id },
              data: { facilities: facList },
            });
          }
          if (masterLockId) {
            const existingUnitInv = await prisma.unitInventory.findUnique({
              where: {
                unitId_propertyInventoryId: {
                  unitId: u.id,
                  propertyInventoryId: masterLockId,
                },
              },
            });
            if (!existingUnitInv) {
              await prisma.unitInventory.create({
                data: {
                  unitId: u.id,
                  propertyInventoryId: masterLockId,
                  itemName: 'Smart Lock Pintu',
                  quantity: 1,
                  condition: 'Baik',
                },
              });
            }
          }
        }
      }
    } else if (data.hasSmartLock === false) {
      // JIKA FALSE: Hapus fasilitas Smart Lock dari Master Inventaris Fasilitas
      const lockItems = await prisma.propertyInventory.findMany({
        where: {
          propertyId: id,
          itemName: { in: ['Smart Lock', 'Smart Lock Pintu', 'Smart Lock Pintu Unit'] },
        },
        select: { id: true },
      });
      if (lockItems.length > 0) {
        const lockIds = lockItems.map((l) => l.id);
        await prisma.unitInventory.deleteMany({
          where: { propertyInventoryId: { in: lockIds } },
        });
        await prisma.propertyInventory.deleteMany({
          where: { id: { in: lockIds } },
        });
      }

      // Hapus 'Smart Lock Pintu' dari facilities pada semua unit di properti ini dan reset PIN
      if (updated.units && updated.units.length > 0) {
        for (const u of updated.units) {
          const facList = Array.isArray(u.facilities) ? [...u.facilities] : [];
          if (facList.some((f) => f.toLowerCase().includes('smart lock'))) {
            const filteredFacs = facList.filter((f) => !f.toLowerCase().includes('smart lock'));
            await prisma.unit.update({
              where: { id: u.id },
              data: {
                facilities: filteredFacs,
                smartLockPin: null,
              },
            });
          }
        }
      }
    }

    return updated;
  }

  /**
   * Toggle cleaning service for a property
   */
  static async toggleCleaningService(id: string, enabled?: boolean) {
    const current = await prisma.property.findUnique({
      where: { id },
      select: { hasCleaningService: true },
    });

    if (!current) {
      throw new Error(`Property dengan ID '${id}' tidak ditemukan`);
    }

    const nextValue = enabled !== undefined ? enabled : !current.hasCleaningService;

    return prisma.property.update({
      where: { id },
      data: { hasCleaningService: nextValue },
    });
  }

  /**
   * Delete property
   */
  static async deleteProperty(id: string) {
    return prisma.property.delete({
      where: { id },
    });
  }
}
