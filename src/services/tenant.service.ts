import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/client";
import { CreateTenantInput, UpdateTenantInput } from "@/lib/validations/tenant.schema";

export interface TenantFilterParams {
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Tenant Service Layer
 * Encapsulates Prisma queries and business logic for Tenant Profiles and Tenant Users.
 */
export class TenantService {
  /**
   * Get paginated & filtered list of tenants
   */
  static async getAllTenants(params: TenantFilterParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { user: { fullName: { contains: params.search, mode: "insensitive" } } },
        { user: { email: { contains: params.search, mode: "insensitive" } } },
        { user: { phoneNumber: { contains: params.search, mode: "insensitive" } } },
        { nik: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.tenantProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              avatarUrl: true,
              isActive: true,
              createdAt: true,
            },
          },
          leases: {
            where: { status: "ACTIVE" },
            include: {
              unit: {
                select: {
                  id: true,
                  unitNumber: true,
                  property: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              leases: true,
            },
          },
        },
      }),
      prisma.tenantProfile.count({ where }),
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
   * Get tenant profile detail by ID (TenantProfile ID or User ID)
   */
  static async getTenantById(id: string) {
    return prisma.tenantProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            isActive: true,
            createdAt: true,
          },
        },
        leases: {
          orderBy: { createdAt: "desc" },
          include: {
            unit: {
              select: {
                id: true,
                unitNumber: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                  },
                },
              },
            },
            invoices: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
      },
    });
  }

  /**
   * Create new tenant profile (Creates User with TENANT role + TenantProfile)
   */
  static async createTenant(data: CreateTenantInput) {
    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error(`Email ${data.email} sudah terdaftar.`);
    }

    return prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber || null,
        role: UserRole.TENANT,
        tenantProfile: {
          create: {
            nik: data.nik || null,
            ktpImageUrl: data.ktpImageUrl || null,
            emergencyName: data.emergencyName || null,
            emergencyPhone: data.emergencyPhone || null,
            occupation: data.occupation || null,
          },
        },
      },
      include: {
        tenantProfile: true,
      },
    });
  }

  /**
   * Update existing tenant profile & user details
   */
  static async updateTenant(id: string, data: UpdateTenantInput) {
    const tenant = await this.getTenantById(id);
    if (!tenant) {
      throw new Error("Tenant Profile tidak ditemukan");
    }

    // Update User & TenantProfile in transaction
    return prisma.$transaction(async (tx) => {
      if (data.fullName || data.email || data.phoneNumber !== undefined) {
        await tx.user.update({
          where: { id: tenant.userId },
          data: {
            ...(data.fullName && { fullName: data.fullName }),
            ...(data.email && { email: data.email }),
            ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber || null }),
          },
        });
      }

      return tx.tenantProfile.update({
        where: { id: tenant.id },
        data: {
          ...(data.nik !== undefined && { nik: data.nik || null }),
          ...(data.ktpImageUrl !== undefined && { ktpImageUrl: data.ktpImageUrl || null }),
          ...(data.emergencyName !== undefined && { emergencyName: data.emergencyName || null }),
          ...(data.emergencyPhone !== undefined && { emergencyPhone: data.emergencyPhone || null }),
          ...(data.occupation !== undefined && { occupation: data.occupation || null }),
        },
        include: {
          user: true,
        },
      });
    });
  }

  /**
   * Delete tenant profile
   */
  static async deleteTenant(id: string) {
    const tenant = await this.getTenantById(id);
    if (!tenant) {
      throw new Error("Tenant Profile tidak ditemukan");
    }

    return prisma.user.delete({
      where: { id: tenant.userId },
    });
  }
}
