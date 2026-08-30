import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { getOwnerSaaSStatus } from "@/lib/saas-features";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);

    const [plans, masterFeatures, addOns, paymentMethods] = await Promise.all([
      prisma.saaSPlan.findMany({
        where: { status: "ACTIVE" },
        orderBy: { priceMonthly: "asc" },
        include: {
          planFeatures: {
            include: {
              feature: true,
            },
          },
          _count: {
            select: { subscriptions: true },
          },
        },
      }),

      prisma.saaSFeature.findMany({
        where: { isEnabled: true },
        orderBy: { createdAt: "asc" },
      }),

      prisma.saaSAddOn.findMany({
        where: { status: "ACTIVE" },
        orderBy: { priceMonthly: "asc" },
      }),

      prisma.saaSPaymentMethod.findMany({
        where: { isEnabled: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    let ownerStatus: any = null;
    let pendingInvoice = null;
    let invoices: any[] = [];

    if (authUser) {
      ownerStatus = await getOwnerSaaSStatus(authUser.id);
      const sub = await prisma.ownerSubscription.findFirst({
        where: { ownerId: authUser.id },
      });
      if (sub) {
        const rawInvoices = await prisma.saaSInvoice.findMany({
          where: { subscriptionId: sub.id },
          orderBy: { createdAt: "desc" },
          include: {
            items: true,
            subscription: {
              include: {
                plan: true,
              },
            },
          },
        });

        invoices = rawInvoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          amount: Number(inv.amount),
          status: inv.status,
          paymentProof: inv.paymentProof,
          dueDate: inv.dueDate,
          paidAt: inv.paidAt,
          createdAt: inv.createdAt,
          ownerName: authUser.fullName || "Owner Properti",
          ownerEmail: authUser.email || "-",
          planName: inv.subscription?.plan?.name || ownerStatus?.planName || "Paket SaaS",
          items: inv.items.map((it) => ({
            id: it.id,
            itemTitle: it.itemTitle,
            amount: Number(it.unitPrice),
            itemType: it.itemType,
          })),
        }));

        pendingInvoice = invoices.find((inv) =>
          ["PENDING", "PENDING_VERIFICATION"].includes(inv.status)
        ) || null;
      }
    }

    const formattedPlans = plans.map((p) => ({
      id: p.id,
      name: p.name,
      maxProperties: p.maxProperties,
      maxUnits: p.maxUnits,
      maxHousekeeping: p.maxHousekeeping,
      priceMonthly: Number(p.priceMonthly),
      priceYearly: Number(p.priceYearly),
      isDefault: p.isDefault,
      subscriberCount: p._count.subscriptions,
      featureCodes: p.planFeatures
        .filter((pf) => pf.feature?.isEnabled)
        .map((pf) => pf.feature.code),
      features: p.planFeatures
        .filter((pf) => pf.feature?.isEnabled)
        .map((pf) => pf.feature.name),
    }));

    const formattedAddOns = addOns.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      unitQuota: a.unitQuota,
      priceMonthly: Number(a.priceMonthly),
      priceYearly: Number(a.priceYearly),
      description: a.description,
    }));

    const supportEmailSetting = await prisma.systemSetting.findUnique({
      where: { key: "support_email" },
    });
    const supportEmail = supportEmailSetting?.value || "support@arventa.id";

    return ApiResponse.success({
      message: "Berhasil mengambil data paket langganan & fitur",
      data: {
        plans: formattedPlans,
        masterFeatures,
        addOns: formattedAddOns,
        ownerStatus,
        pendingInvoice,
        invoices,
        paymentMethods,
        supportEmail,
      },
    });
  } catch (error: any) {
    console.error("GET /api/owner/plans error:", error);
    return ApiResponse.error({
      message: "Gagal mengambil data paket langganan",
      error: error?.message || error,
      status: 500,
    });
  }
}
