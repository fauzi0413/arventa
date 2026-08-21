import { prisma } from "@/lib/prisma";
import { PropertyType } from "@/generated/prisma/client";
import { CreatePropertyInput, UpdatePropertyInput } from "@/lib/validations/property.schema";

export interface PropertyFilterParams {
  search?: string;
  type?: PropertyType;
  city?: string;
  ownerId?: string;
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
        units: {
          orderBy: { unitNumber: "asc" },
          include: {
            _count: {
              select: {
                inventories: true,
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
    return prisma.property.create({
      data: {
        ownerId: data.ownerId,
        name: data.name,
        type: data.type as PropertyType,
        address: data.address,
        city: data.city,
        description: data.description,
        coverImage: data.coverImage,
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
      },
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
