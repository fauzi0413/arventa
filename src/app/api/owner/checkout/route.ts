import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { calculateUnusedSubscriptionCredit } from "@/lib/saas-features";

export const dynamic = "force-dynamic";

/**
 * Helper to generate unique Invoice Billing Code
 * Format: INV-SAAS-YYYYMMDD-XXXX (e.g. INV-SAAS-20260829-9B1A)
 */
function generateInvoiceCode(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomHex = Math.floor(1000 + Math.random() * 9000)
    .toString(16)
    .toUpperCase();
  return `INV-SAAS-${dateStr}-${randomHex}`;
}

/**
 * POST /api/owner/checkout
 * Converts active cart into a formal SaaSInvoice with accurate duration pricing & prorated upgrade/downgrade calculation
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return ApiResponse.unauthorized("Belum terautentikasi");
    }

    const body = await req.json();
    const { planId, addOnIds, durationMonths: rawDuration } = body;
    const durationMonths = Number(rawDuration) || 1;

    // 1. Get or create active OwnerSubscription
    let subscription = await prisma.ownerSubscription.findFirst({
      where: { ownerId: authUser.id, status: "ACTIVE" },
      include: { plan: true },
    });

    let selectedPlan = null;
    if (planId) {
      selectedPlan = await prisma.saaSPlan.findUnique({ where: { id: planId } });
    }

    if (!subscription) {
      const defaultPlan =
        (await prisma.saaSPlan.findFirst({ where: { isDefault: true } })) ||
        (await prisma.saaSPlan.findFirst({ where: { name: { contains: "Perintis", mode: "insensitive" } } })) ||
        (await prisma.saaSPlan.findFirst({ orderBy: { priceMonthly: "asc" } }));

      if (!defaultPlan) {
        return ApiResponse.badRequest("Paket SaaS tidak ditemukan");
      }

      subscription = await prisma.ownerSubscription.create({
        data: {
          ownerId: authUser.id,
          planId: defaultPlan.id,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        include: { plan: true },
      });
    }

    // 2. Calculate Prices based on Exact Duration Months (No arbitrary fake discounts)
    const invoiceItemsData: Array<{
      itemType: string;
      itemTitle: string;
      unitPrice: number;
      quantity: number;
    }> = [];

    let totalAmount = 0;

    const getDurationLabel = (m: number) => {
      if (m === 12) return "1 Tahun (12 Bulan)";
      return `${m} Bulan`;
    };

    const getPlanPrice = (plan: any, m: number) => {
      const monthly = Number(plan.priceMonthly);
      const yearly = Number(plan.priceYearly);
      if (m === 12) return yearly > 0 ? yearly : monthly * 12;
      return Math.round(monthly * m);
    };

    const getAddOnPrice = (addon: any, m: number) => {
      const monthly = Number(addon.priceMonthly);
      const yearly = Number(addon.priceYearly);
      if (m === 12) return yearly > 0 ? yearly : monthly * 12;
      return Math.round(monthly * m);
    };

    if (selectedPlan && selectedPlan.id !== subscription.planId) {
      const newPlanPrice = getPlanPrice(selectedPlan, durationMonths);
      const currentMonthlyPrice = Number(subscription.plan?.priceMonthly || 0);
      const targetMonthlyPrice = Number(selectedPlan.priceMonthly || 0);

      if (targetMonthlyPrice >= currentMonthlyPrice) {
        // UPGRADE SCENARIO: Prorate Credit Calculation
        const { remainingDays, unusedCredit } = calculateUnusedSubscriptionCredit(subscription);
        const proratedDiscount = Math.min(unusedCredit, newPlanPrice);
        const netUpgradePrice = Math.max(0, newPlanPrice - proratedDiscount);

        invoiceItemsData.push({
          itemType: "PLAN",
          itemTitle: `Upgrade Paket ${selectedPlan.name} (${getDurationLabel(durationMonths)})`,
          unitPrice: newPlanPrice,
          quantity: 1,
        });

        if (proratedDiscount > 0) {
          invoiceItemsData.push({
            itemType: "PLAN_DISCOUNT",
            itemTitle: `Potongan Sisa Langganan ${subscription.plan.name} (${remainingDays} Hari)`,
            unitPrice: -proratedDiscount,
            quantity: 1,
          });
        }

        totalAmount += netUpgradePrice;
      } else {
        // DOWNGRADE SCENARIO: Paket Baru Lebih Murah -> Rp 0
        invoiceItemsData.push({
          itemType: "PLAN",
          itemTitle: `Downgrade Paket ${selectedPlan.name} (${getDurationLabel(durationMonths)}) - Rp 0`,
          unitPrice: 0,
          quantity: 1,
        });

        invoiceItemsData.push({
          itemType: "PLAN_INFO",
          itemTitle: `Informasi: Penyesuaian ke paket lebih murah (Rp 0). Data unit berlebih akan digembok.`,
          unitPrice: 0,
          quantity: 1,
        });

        totalAmount += 0;
      }
    }

    if (Array.isArray(addOnIds) && addOnIds.length > 0) {
      const dbAddOns = await prisma.saaSAddOn.findMany({
        where: { id: { in: addOnIds } },
      });

      for (const addon of dbAddOns) {
        const price = getAddOnPrice(addon, durationMonths);
        invoiceItemsData.push({
          itemType: "ADD_ON",
          itemTitle: `Add-On: ${addon.name} (${getDurationLabel(durationMonths)})`,
          unitPrice: price,
          quantity: 1,
        });
        totalAmount += price;
      }
    }


    if (invoiceItemsData.length === 0) {
      return ApiResponse.badRequest("Keranjang belanja kosong. Silakan pilih paket atau Add-On.");
    }

    // 3. Generate Unique Billing Code
    let invoiceNumber = generateInvoiceCode();
    let isCodeUnique = false;
    let attempts = 0;
    while (!isCodeUnique && attempts < 5) {
      const existing = await prisma.saaSInvoice.findUnique({ where: { invoiceNumber } });
      if (!existing) {
        isCodeUnique = true;
      } else {
        invoiceNumber = generateInvoiceCode();
        attempts++;
      }
    }

    // 4. Create SaaSInvoice and SaaSInvoiceItems in DB Transaction
    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days due
    const isAutoFree = totalAmount <= 0;
    const invoiceStatus = isAutoFree ? "PAID" : "PENDING";
    const paidAtDate = isAutoFree ? new Date() : null;

    const invoice = await prisma.saaSInvoice.create({
      data: {
        subscriptionId: subscription.id,
        invoiceNumber,
        amount: totalAmount,
        status: invoiceStatus,
        paidAt: paidAtDate,
        dueDate,
        items: {
          create: invoiceItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // If invoice is Rp 0 (e.g. downgrade adjustment), apply new plan immediately
    if (isAutoFree && selectedPlan) {
      await prisma.ownerSubscription.update({
        where: { id: subscription.id },
        data: {
          planId: selectedPlan.id,
          status: "ACTIVE",
        },
      });
    }


    // 5. Clear Owner's SaaSCart Items and selected plan after order creation
    const cart = await prisma.saaSCart.findUnique({ where: { ownerId: authUser.id } });
    if (cart) {
      await prisma.saaSCartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.saaSCart.update({
        where: { id: cart.id },
        data: { selectedPlanId: null },
      });
    }

    const formattedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.amount),
      status: invoice.status,
      paymentProof: invoice.paymentProof,
      dueDate: invoice.dueDate,
      createdAt: invoice.createdAt,
      ownerName: authUser.fullName || "Owner Properti",
      ownerEmail: authUser.email || "-",
      planName: selectedPlan ? selectedPlan.name : "Paket SaaS",
      items: invoice.items.map((it) => ({
        id: it.id,
        itemTitle: it.itemTitle,
        amount: Number(it.unitPrice),
        unitPrice: Number(it.unitPrice),
        itemType: it.itemType,
      })),
    };

    // 6. Fetch Active Payment Methods
    const paymentMethods = await prisma.saaSPaymentMethod.findMany({
      where: { isEnabled: true },
    });

    return ApiResponse.success({
      message: `Invoice transaksi berhasil dibuat dengan nomor billing ${invoiceNumber}`,
      data: {
        invoice: formattedInvoice,
        paymentMethods,
      },
    });
  } catch (error: any) {
    console.error("POST /api/owner/checkout error:", error);
    return ApiResponse.error({
      message: "Gagal memproses checkout transaksi SaaS",
      error: error?.message || error,
      status: 500,
    });
  }
}
