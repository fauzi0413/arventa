import { prisma } from "@/lib/prisma";
import { PropertyType } from "@/generated/prisma/client";
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
          type: data.type as PropertyType,
          address: data.address,
          city: data.city || "Jakarta",
          description: data.description || "",
          coverImage: data.coverImage || "",
          hasCleaningService: data.hasCleaningService ?? true,
          defaultLateFee: data.defaultLateFee ?? 50000,
          defaultDeposit: data.defaultDeposit ?? 0,
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

      // If totalUnits specified, automatically create initial room units in database
      if (totalUnitsCount > 0) {
        const unitsToCreate = Array.from({ length: totalUnitsCount }).map((_, idx) => {
          const roomNum = idx + 1;
          const formattedNumber =
            data.type === "APARTEMEN"
              ? `Unit ${roomNum < 10 ? "0" + roomNum : roomNum}`
              : data.type === "RUKO"
              ? `Ruko Blok ${String.fromCharCode(65 + Math.floor(idx / 10))}-${(idx % 10) + 1}`
              : `Kamar ${100 + roomNum}`;

          return {
            propertyId: newProperty.id,
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
          };
        });

        await tx.unit.createMany({
          data: unitsToCreate,
        });
      }

      return newProperty;
    });
  }

  /**
   * Update existing property
   */
  static async updateProperty(id: string, data: UpdatePropertyInput) {
    return prisma.property.update({
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
      },
    });
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
