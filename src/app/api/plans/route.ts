import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/plans
 * Public endpoint — returns only ACTIVE SaaS subscription plans.
 * No auth required; used by the landing page pricing section.
 */
export async function GET() {
  try {
    const plans = await prisma.saaSPlan.findMany({
      where: { status: "ACTIVE" },
      orderBy: { priceMonthly: "asc" },
      include: {
        planFeatures: {
          include: {
            feature: {
              select: { name: true, isEnabled: true },
            },
          },
        },
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    // Determine the most popular plan: highest subscriber count.
    // If all plans have 0 subscribers, pick the second plan (index 1) as popular fallback.
    let mostPopularId: string | null = null;
    const maxSubscribers = Math.max(...plans.map((p) => p._count.subscriptions));

    if (maxSubscribers > 0) {
      const popularPlan = plans.find(
        (p) => p._count.subscriptions === maxSubscribers
      );
      mostPopularId = popularPlan?.id ?? null;
    } else if (plans.length >= 2) {
      // fallback: second plan (index 1) is "paling populer"
      mostPopularId = plans[1].id;
    }

    const formattedPlans = plans.map((plan) => {
      const priceMonthly = Number(plan.priceMonthly);
      const priceYearly = Number(plan.priceYearly);
      // Yearly discount % vs paying monthly for 12 months
      const yearlyMonthlyEquivalent = priceMonthly * 12;
      const discountPercent =
        yearlyMonthlyEquivalent > 0
          ? Math.round(
              ((yearlyMonthlyEquivalent - priceYearly) / yearlyMonthlyEquivalent) *
                100
            )
          : 0;
      const priceYearlyPerMonth = priceYearly > 0 ? Math.round(priceYearly / 12) : 0;

      return {
        id: plan.id,
        name: plan.name,
        priceMonthly,
        priceYearly,
        priceYearlyPerMonth,
        discountPercent,
        maxProperties: plan.maxProperties,
        maxUnits: plan.maxUnits,
        maxHousekeeping: plan.maxHousekeeping ?? 0,
        features: plan.planFeatures
          .filter((pf) => pf.feature?.isEnabled)
          .map((pf) => pf.feature.name),
        isDefault: Boolean(plan.isDefault),
        isMostPopular: plan.id === mostPopularId,
        subscriberCount: plan._count.subscriptions,
      };
    });

    return NextResponse.json({
      success: true,
      data: { plans: formattedPlans },
    });
  } catch (error) {
    console.error("GET /api/plans error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data paket langganan." },
      { status: 500 }
    );
  }
}
