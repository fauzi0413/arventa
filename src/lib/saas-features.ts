import { prisma } from "@/lib/prisma";

export const SAAS_FEATURE_CODES = {
  PROP_MGMT: "PROP_MGMT",
  TENANT_MGMT: "TENANT_MGMT",
  HOUSEKEEPING_MODULE: "HOUSEKEEPING_MODULE",
  FAST_CHECKIN: "FAST_CHECKIN",
  WA_REMINDER: "WA_REMINDER",
  FINANCIAL_ANALYTICS: "FINANCIAL_ANALYTICS",
  OCR_KTP: "OCR_KTP",
  CUSTOM_DOMAIN: "CUSTOM_DOMAIN",
} as const;

/**
 * Route path to required SaaS feature code mapping
 */
export const ROUTE_FEATURE_MAP: Record<string, string> = {
  "/operations/housekeeping-team": SAAS_FEATURE_CODES.HOUSEKEEPING_MODULE,
  "/finance": SAAS_FEATURE_CODES.FINANCIAL_ANALYTICS,
  "/finance/expenses": SAAS_FEATURE_CODES.FINANCIAL_ANALYTICS,
  "/reports": SAAS_FEATURE_CODES.FINANCIAL_ANALYTICS,
};

/**
 * Get active subscription, feature codes, limits, and closest plan mapping for an Owner
 */
export async function getOwnerSaaSStatus(ownerId: string) {
  try {
    // 1. Fetch active plans ordered by price ascending to resolve closest available plan for each feature
    const activePlans = await prisma.saaSPlan.findMany({
      where: { status: "ACTIVE" },
      orderBy: { priceMonthly: "asc" },
      include: {
        planFeatures: {
          include: {
            feature: true,
          },
        },
      },
    });

    const cheapestPlan = activePlans.length > 0 ? activePlans[0] : null;
    const highestPlan = activePlans.length > 0 ? activePlans[activePlans.length - 1] : null;
    const highestPlanName = highestPlan ? highestPlan.name : "Juragan";

    const closestPlanMap: Record<string, string> = {};
    for (const plan of activePlans) {
      for (const pf of plan.planFeatures) {
        if (pf.feature?.isEnabled && !closestPlanMap[pf.feature.code]) {
          closestPlanMap[pf.feature.code] = plan.name;
        }
      }
    }

    // Default unmapped premium features to highest plan name from DB
    if (!closestPlanMap[SAAS_FEATURE_CODES.HOUSEKEEPING_MODULE]) {
      closestPlanMap[SAAS_FEATURE_CODES.HOUSEKEEPING_MODULE] = highestPlanName;
    }
    if (!closestPlanMap[SAAS_FEATURE_CODES.FINANCIAL_ANALYTICS]) {
      closestPlanMap[SAAS_FEATURE_CODES.FINANCIAL_ANALYTICS] = highestPlanName;
    }
    if (!closestPlanMap[SAAS_FEATURE_CODES.OCR_KTP]) {
      closestPlanMap[SAAS_FEATURE_CODES.OCR_KTP] = highestPlanName;
    }
    if (!closestPlanMap[SAAS_FEATURE_CODES.CUSTOM_DOMAIN]) {
      closestPlanMap[SAAS_FEATURE_CODES.CUSTOM_DOMAIN] = highestPlanName;
    }

    const subscription = await prisma.ownerSubscription.findFirst({
      where: {
        ownerId,
        status: "ACTIVE",
      },
      include: {
        plan: {
          include: {
            planFeatures: {
              include: {
                feature: true,
              },
            },
          },
        },
        subscriptionAddOns: {
          where: { status: "ACTIVE" },
          include: {
            addOn: true,
          },
        },
      },
    });

    if (!subscription) {
      // Find the configured default SaaS plan (isDefault: true) or cheapest plan from database
      const configuredDefaultPlan = activePlans.find((p: any) => p.isDefault);
      const defaultPlanToUse = configuredDefaultPlan || cheapestPlan;

      if (defaultPlanToUse) {
        const defaultFeatureCodes = defaultPlanToUse.planFeatures
          .filter((pf) => pf.feature?.isEnabled)
          .map((pf) => pf.feature.code);

        const enabledFeatureCodes = Array.from(
          new Set([
            SAAS_FEATURE_CODES.PROP_MGMT,
            SAAS_FEATURE_CODES.TENANT_MGMT,
            ...defaultFeatureCodes,
          ])
        );

        return {
          hasActiveSubscription: false,
          planName: defaultPlanToUse.name,
          highestPlanName,
          maxProperties: defaultPlanToUse.maxProperties,
          maxUnits: defaultPlanToUse.maxUnits,
          maxHousekeeping: defaultPlanToUse.maxHousekeeping,
          enabledFeatureCodes,
          closestPlanMap,
        };
      }

      // Hardcoded fallback if DB has no plans
      return {
        hasActiveSubscription: false,
        planName: "Perintis",
        highestPlanName: "Juragan",
        maxProperties: 1,
        maxUnits: 5,
        maxHousekeeping: 1,
        enabledFeatureCodes: [
          SAAS_FEATURE_CODES.PROP_MGMT,
          SAAS_FEATURE_CODES.TENANT_MGMT,
          SAAS_FEATURE_CODES.FAST_CHECKIN,
          SAAS_FEATURE_CODES.WA_REMINDER,
        ],
        closestPlanMap,
      };
    }

    // 1. Extract feature codes from Plan
    const planFeatureCodes = subscription.plan.planFeatures
      .filter((pf) => pf.feature?.isEnabled)
      .map((pf) => pf.feature.code);

    // 2. Add features from active Add-Ons
    const addOnFeatureCodes = subscription.subscriptionAddOns
      .filter((sa) => sa.addOn.category === "FEATURE" && sa.addOn.status === "ACTIVE")
      .map((sa) => sa.addOn.name);

    const enabledFeatureCodes = Array.from(
      new Set([
        SAAS_FEATURE_CODES.PROP_MGMT,
        SAAS_FEATURE_CODES.TENANT_MGMT,
        ...planFeatureCodes,
        ...addOnFeatureCodes,
      ])
    );

    // 3. Accumulate quotas from active Add-Ons
    let extraProperties = 0;
    let extraUnits = 0;
    let extraHousekeeping = 0;

    for (const sa of subscription.subscriptionAddOns) {
      if (sa.addOn.category === "PROPERTY") extraProperties += sa.addOn.unitQuota * sa.quantity;
      if (sa.addOn.category === "UNIT") extraUnits += sa.addOn.unitQuota * sa.quantity;
      if (sa.addOn.category === "HOUSEKEEPING") extraHousekeeping += sa.addOn.unitQuota * sa.quantity;
    }

    return {
      hasActiveSubscription: true,
      subscriptionId: subscription.id,
      planId: subscription.plan.id,
      planName: subscription.plan.name,
      planPriceMonthly: Number(subscription.plan.priceMonthly),
      maxProperties: subscription.plan.maxProperties + extraProperties,
      maxUnits: subscription.plan.maxUnits + extraUnits,
      maxHousekeeping: subscription.plan.maxHousekeeping + extraHousekeeping,
      enabledFeatureCodes,
      closestPlanMap,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
    };
  } catch (error) {
    console.error("getOwnerSaaSStatus error:", error);
    return {
      hasActiveSubscription: false,
      planName: "Free",
      maxProperties: 1,
      maxUnits: 10,
      maxHousekeeping: 2,
      enabledFeatureCodes: [SAAS_FEATURE_CODES.PROP_MGMT, SAAS_FEATURE_CODES.TENANT_MGMT],
      closestPlanMap: {},
    };
  }
}

/**
 * Calculate unused credit (prorate) of an active subscription based on remaining days
 */
export function calculateUnusedSubscriptionCredit(subscription: {
  plan?: { priceMonthly: any };
  endDate: Date | string;
}): { remainingDays: number; unusedCredit: number } {
  if (!subscription || !subscription.endDate) {
    return { remainingDays: 0, unusedCredit: 0 };
  }

  const end = new Date(subscription.endDate).getTime();
  const now = new Date().getTime();
  const diffMs = end - now;

  if (diffMs <= 0) {
    return { remainingDays: 0, unusedCredit: 0 };
  }

  const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const monthlyPrice = Number(subscription.plan?.priceMonthly || 0);

  if (monthlyPrice <= 0) {
    return { remainingDays, unusedCredit: 0 };
  }

  const dailyRate = monthlyPrice / 30;
  const unusedCredit = Math.floor(dailyRate * remainingDays);

  return {
    remainingDays,
    unusedCredit: Math.min(unusedCredit, monthlyPrice),
  };
}

/**
 * Get detailed usage vs quota metrics for an Owner to determine soft lock status
 */
export async function getOwnerQuotaMetrics(ownerId: string) {
  const saasStatus = await getOwnerSaaSStatus(ownerId);

  const [propertiesCount, unitsCount] = await Promise.all([
    prisma.property.count({ where: { ownerId } }),
    prisma.unit.count({ where: { property: { ownerId } } }),
  ]);

  const excessProperties = Math.max(0, propertiesCount - saasStatus.maxProperties);
  const excessUnits = Math.max(0, unitsCount - saasStatus.maxUnits);
  const isQuotaExceeded = excessProperties > 0 || excessUnits > 0;

  return {
    ...saasStatus,
    propertiesCount,
    unitsCount,
    excessProperties,
    excessUnits,
    isQuotaExceeded,
  };
}

