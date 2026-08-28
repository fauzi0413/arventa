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
   * Get property detail by ID
   */
  static async getPropertyById(id: string) {
    return prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
        inventories: true,
        units: {
          orderBy: { unitNumber: "asc" },
          include: {
            inventoryItems: true,
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
          },
        },
      },
    });
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
            deposit: 0,
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
