import { prisma } from "@/lib/prisma";
import { InvoiceStatus, LeaseStatus } from "@/generated/prisma/client";
import { CreateInvoiceInput, UpdateInvoiceInput, InvoiceFilterInput } from "@/lib/validations/invoice.schema";

export class InvoiceService {
  /**
   * Helper to generate a unique invoice number
   */
  private static generateInvoiceNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `INV-${dateStr}-${randomStr}`;
  }

  /**
   * Fetch paginated and filtered invoices strictly scoped to accessible properties or tenant
   */
  static async getInvoicesForOwner(
    ownerId?: string | null,
    filters?: InvoiceFilterInput,
    propertyIds?: string[],
    tenantUserId?: string
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const propertyScope: any = {};
    if (propertyIds && propertyIds.length > 0) {
      propertyScope.id = { in: propertyIds };
    } else if (ownerId) {
      propertyScope.ownerId = ownerId;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    if (Object.keys(propertyScope).length > 0) {
      whereClause.lease = {
        unit: {
          property: propertyScope,
        },
      };
    }

    if (tenantUserId) {
      whereClause.lease = {
        ...(whereClause.lease || {}),
        tenant: { userId: tenantUserId },
      };
    }

    // Filter by specific property
    if (filters?.propertyId && filters.propertyId !== "ALL") {
      whereClause.lease = {
        ...(whereClause.lease || {}),
        unit: {
          ...(whereClause.lease?.unit || {}),
          propertyId: filters.propertyId,
        },
      };
    }

    // Filter by Status
    if (filters?.status && filters.status !== "ALL") {
      whereClause.status = filters.status as InvoiceStatus;
    }

    // Filter by Date Range (on dueDate)
    if (filters?.startDate || filters?.endDate) {
      whereClause.dueDate = {};
      if (filters.startDate) {
        whereClause.dueDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.dueDate.lte = end;
      }
    }

    // Filter by Search query (Invoice #, Tenant Name, Unit Number)
    if (filters?.search && filters.search.trim() !== "") {
      const search = filters.search.trim();
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { invoiceNumber: { contains: search, mode: "insensitive" } },
            {
              lease: {
                tenant: {
                  OR: [
                    { fullName: { contains: search, mode: "insensitive" } },
                    { user: { fullName: { contains: search, mode: "insensitive" } } },
                  ],
                },
              },
            },
            {
              lease: {
                unit: {
                  unitNumber: { contains: search, mode: "insensitive" },
                },
              },
            },
          ],
        },
      ];
    }

    // Stats scope filter (independent of status filter, but scoped to properties/user)
    const statsWhere: any = {};
    if (Object.keys(propertyScope).length > 0) {
      statsWhere.lease = {
        unit: {
          property: propertyScope,
        },
      };
    }
    if (tenantUserId) {
      statsWhere.lease = {
        ...(statsWhere.lease || {}),
        tenant: { userId: tenantUserId },
      };
    }
    if (filters?.propertyId && filters.propertyId !== "ALL") {
      statsWhere.lease = {
        ...(statsWhere.lease || {}),
        unit: {
          ...(statsWhere.lease?.unit || {}),
          propertyId: filters.propertyId,
        },
      };
    }

    // Execute queries in parallel
    const [items, totalCount, statsAll, statsPaid, statsPending, statsOverdue] = await Promise.all([
      prisma.invoice.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          lease: {
            include: {
              unit: {
                include: {
                  property: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                    },
                  },
                },
              },
              tenant: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                      phoneNumber: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.invoice.count({ where: whereClause }),

      // Summary Statistics
      prisma.invoice.aggregate({
        where: statsWhere,
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.invoice.aggregate({
        where: { ...statsWhere, status: InvoiceStatus.PAID },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.invoice.aggregate({
        where: { ...statsWhere, status: InvoiceStatus.PENDING },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.invoice.aggregate({
        where: { ...statsWhere, status: InvoiceStatus.OVERDUE },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: totalPages || 1,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats: {
        totalAmount: Number(statsAll._sum.totalAmount || 0),
        totalCount: statsAll._count.id || 0,
        paidAmount: Number(statsPaid._sum.totalAmount || 0),
        paidCount: statsPaid._count.id || 0,
        pendingAmount: Number(statsPending._sum.totalAmount || 0),
        pendingCount: statsPending._count.id || 0,
        overdueAmount: Number(statsOverdue._sum.totalAmount || 0),
        overdueCount: statsOverdue._count.id || 0,
      },
    };
  }

  /**
   * Get single invoice detail by ID with property access check
   */
  static async getInvoiceById(
    id: string,
    ownerId?: string | null,
    propertyIds?: string[],
    tenantUserId?: string
  ) {
    const propertyScope: any = {};
    if (propertyIds && propertyIds.length > 0) {
      propertyScope.id = { in: propertyIds };
    } else if (ownerId) {
      propertyScope.ownerId = ownerId;
    }

    const where: any = { id };
    if (Object.keys(propertyScope).length > 0) {
      where.lease = {
        unit: {
          property: propertyScope,
        },
      };
    }
    if (tenantUserId) {
      where.lease = {
        ...(where.lease || {}),
        tenant: { userId: tenantUserId },
      };
    }

    const invoice = await prisma.invoice.findFirst({
      where,
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: true,
              },
            },
            tenant: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new Error("Invoice tidak ditemukan atau Anda tidak memiliki akses ke properti ini.");
    }

    return invoice;
  }

  /**
   * Create a new invoice for a tenant lease
   */
  static async createInvoice(
    ownerId: string | null,
    input: CreateInvoiceInput,
    propertyIds?: string[]
  ) {
    const leaseWhere: any = { id: input.leaseId };
    if (propertyIds && propertyIds.length > 0) {
      leaseWhere.unit = { propertyId: { in: propertyIds } };
    } else if (ownerId) {
      leaseWhere.unit = { property: { ownerId } };
    }

    const lease = await prisma.lease.findFirst({
      where: leaseWhere,
      include: {
        unit: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!lease) {
      throw new Error("Kontrak sewa/unit tidak ditemukan atau Anda tidak memiliki akses ke properti ini.");
    }

    const invoiceNumber = this.generateInvoiceNumber();
    const amount = input.amount;
    const utilityAmount = input.utilityAmount || 0;
    const penaltyAmount = input.penaltyAmount || 0;
    const totalAmount = amount + utilityAmount + penaltyAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        leaseId: input.leaseId,
        amount,
        utilityAmount,
        penaltyAmount,
        totalAmount,
        dueDate: new Date(input.dueDate),
        status: InvoiceStatus.PENDING,
      },
      include: {
        lease: {
          include: {
            unit: { include: { property: true } },
            tenant: { include: { user: true } },
          },
        },
      },
    });

    return invoice;
  }

  /**
   * Update an existing Invoice details
   */
  static async updateInvoice(
    id: string,
    ownerId?: string | null,
    input?: UpdateInvoiceInput,
    propertyIds?: string[]
  ) {
    const existing = await this.getInvoiceById(id, ownerId, propertyIds);

    const amount = input?.amount !== undefined ? input.amount : Number(existing.amount);
    const utilityAmount = input?.utilityAmount !== undefined ? input.utilityAmount : Number(existing.utilityAmount);
    const penaltyAmount = input?.penaltyAmount !== undefined ? input.penaltyAmount : Number(existing.penaltyAmount);
    const totalAmount = amount + utilityAmount + penaltyAmount;

    const dataToUpdate: any = {
      amount,
      utilityAmount,
      penaltyAmount,
      totalAmount,
    };

    if (input?.dueDate) {
      dataToUpdate.dueDate = new Date(input.dueDate);
    }

    if (input?.status) {
      dataToUpdate.status = input.status;
      if (input.status === InvoiceStatus.PAID && !existing.paidAt) {
        dataToUpdate.paidAt = new Date();
      }
    }

    if (input?.paymentReceipt !== undefined) {
      dataToUpdate.paymentReceipt = input.paymentReceipt;
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: dataToUpdate,
      include: {
        lease: {
          include: {
            unit: { include: { property: true } },
            tenant: { include: { user: true } },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Quick status update for an Invoice
   */
  static async updateInvoiceStatus(
    id: string,
    ownerId?: string | null,
    status?: InvoiceStatus,
    paymentReceipt?: string | null,
    paidAtInput?: string | null,
    propertyIds?: string[]
  ) {
    const existing = await this.getInvoiceById(id, ownerId, propertyIds);

    let paidAt: Date | null = existing.paidAt;
    if (status === InvoiceStatus.PAID) {
      paidAt = paidAtInput ? new Date(paidAtInput) : existing.paidAt || new Date();
    } else if (status === InvoiceStatus.PENDING || status === InvoiceStatus.CANCELLED) {
      paidAt = null;
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: status || existing.status,
        paidAt,
        paymentReceipt: paymentReceipt !== undefined ? paymentReceipt : existing.paymentReceipt,
      },
      include: {
        lease: {
          include: {
            unit: { include: { property: true } },
            tenant: { include: { user: true } },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete an Invoice
   */
  static async deleteInvoice(id: string, ownerId?: string | null, propertyIds?: string[]) {
    await this.getInvoiceById(id, ownerId, propertyIds);
    return prisma.invoice.delete({
      where: { id },
    });
  }

  /**
   * Get active leases scoped strictly to accessible properties for invoice dropdown selection
   */
  static async getActiveLeasesForOwner(
    ownerId?: string | null,
    propertyId?: string,
    propertyIds?: string[],
    tenantUserId?: string
  ) {
    const propertyScope: any = {};
    if (propertyIds && propertyIds.length > 0) {
      propertyScope.id = { in: propertyIds };
    } else if (ownerId) {
      propertyScope.ownerId = ownerId;
    }

    const whereClause: any = {
      status: LeaseStatus.ACTIVE,
      unit: {},
    };

    if (Object.keys(propertyScope).length > 0) {
      whereClause.unit.property = propertyScope;
    }

    if (propertyId && propertyId !== "ALL") {
      whereClause.unit.propertyId = propertyId;
    }

    if (tenantUserId) {
      whereClause.tenant = { userId: tenantUserId };
    }

    const leases = await prisma.lease.findMany({
      where: whereClause,
      include: {
        unit: {
          include: {
            property: {
              select: { id: true, name: true },
            },
          },
        },
        tenant: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, phoneNumber: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return leases.map((lease) => ({
      leaseId: lease.id,
      unitId: lease.unitId,
      unitNumber: lease.unit.unitNumber,
      propertyId: lease.unit.propertyId,
      propertyName: lease.unit.property.name,
      tenantId: lease.tenantId,
      tenantName: lease.tenant.fullName || lease.tenant.user?.fullName || "Penyewa Tanpa Nama",
      tenantPhone: lease.tenant.phoneNumber || lease.tenant.user?.phoneNumber || "-",
      rentPrice: Number(lease.rentPrice || lease.unit.basePrice || 0),
    }));
  }
}
