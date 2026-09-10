import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return ApiResponse.unauthorized("Authentication required to access tenant invoices");
    }

    // 1. Find TenantProfiles associated with user (by ID or email)
    const tenantProfiles = await prisma.tenantProfile.findMany({
      where: {
        OR: [
          { userId: authUser.id },
          { email: authUser.email },
          { user: { email: authUser.email } },
        ],
      },
      select: { id: true },
    });
    const tenantIds = tenantProfiles.map((tp) => tp.id);

    // 2. Find Units associated with user (as Unit Account: unitUserId or unitUser.email)
    const units = await prisma.unit.findMany({
      where: {
        OR: [
          { unitUserId: authUser.id },
          { unitUser: { email: authUser.email } },
        ],
      },
      select: { id: true },
    });
    const unitIds = units.map((u) => u.id);

    const leaseConditions: any[] = [];
    if (tenantIds.length > 0) {
      leaseConditions.push({ tenantId: { in: tenantIds } });
    }
    if (unitIds.length > 0) {
      leaseConditions.push({ unitId: { in: unitIds } });
    }

    if (leaseConditions.length === 0 && authUser.email) {
      const fallbackTenants = await prisma.tenantProfile.findMany({
        where: { email: authUser.email },
        select: { id: true },
      });
      if (fallbackTenants.length > 0) {
        leaseConditions.push({ tenantId: { in: fallbackTenants.map((t) => t.id) } });
      }
    }

    if (leaseConditions.length === 0) {
      return ApiResponse.success({
        message: "No tenant profile or room unit found for account",
        data: [],
        meta: {
          stats: {
            totalAmount: 0,
            pendingAmount: 0,
            paidAmount: 0,
            overdueAmount: 0,
            count: 0,
          },
          paymentMethods: [],
        },
      });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        lease: {
          OR: leaseConditions,
        },
      },
      orderBy: { dueDate: "desc" },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    id: true,
                    ownerId: true,
                    name: true,
                    address: true,
                    city: true,
                    owner: {
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
        },
      },
    });

    let totalAmount = 0;
    let pendingAmount = 0;
    let paidAmount = 0;
    let overdueAmount = 0;

    invoices.forEach((inv) => {
      const tot = Number(inv.totalAmount || 0);
      totalAmount += tot;
      if (inv.status === "PENDING" || inv.status === "PENDING_VERIFICATION") {
        pendingAmount += tot;
      } else if (inv.status === "PAID") {
        paidAmount += tot;
      } else if (inv.status === "OVERDUE") {
        overdueAmount += tot;
      }
    });

    // Fetch active payment methods configured by Property Owner for tenant's occupied property
    const tenantPropertyId = invoices[0]?.lease?.unit?.property?.id;
    const propertyOwnerId = invoices[0]?.lease?.unit?.property?.ownerId;
    let paymentMethods: any[] = [];

    if (propertyOwnerId) {
      paymentMethods = await prisma.ownerPaymentMethod.findMany({
        where: {
          ownerId: propertyOwnerId,
          isEnabled: true,
          OR: [
            { propertyId: null },
            ...(tenantPropertyId ? [{ propertyId: tenantPropertyId }] : []),
          ],
        },
        include: {
          property: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return ApiResponse.success({
      message: "Tenant invoices retrieved successfully",
      data: invoices,
      meta: {
        stats: {
          totalAmount,
          pendingAmount,
          paidAmount,
          overdueAmount,
          count: invoices.length,
        },
        paymentMethods,
      },
    });
  } catch (error: any) {
    return ApiResponse.error({
      message: "Failed to retrieve tenant invoices",
      error,
    });
  }
}
