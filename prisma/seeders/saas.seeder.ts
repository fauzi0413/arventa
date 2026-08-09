import { prisma } from "../../src/lib/prisma";
import { User, SubscriptionStatus, InvoiceStatus } from "../../generated/prisma/client";

/**
 * Seed SaaS Plans, Owner Subscriptions, and SaaS Invoices (Platform Admin Billing).
 */
export async function seedSaaS(owner: User) {
  console.log("\n💳 Seeding SaaS Plans & Subscriptions (Idempotent)...");

  // 1. SaaS Plans
  let planBasic = await prisma.saaSPlan.findUnique({ where: { name: "Basic Tier" } });
  if (!planBasic) {
    planBasic = await prisma.saaSPlan.create({
      data: {
        name: "Basic Tier",
        maxProperties: 1,
        maxUnits: 10,
        priceMonthly: 99000,
        priceYearly: 990000,
        features: ["1 Property", "Up to 10 Units", "Basic Invoicing"],
      },
    });
    console.log(`✅ Created SaaS Plan: ${planBasic.name}`);
  } else {
    console.log(`ℹ️ Existing SaaS Plan found: ${planBasic.name}`);
  }

  let planPro = await prisma.saaSPlan.findUnique({ where: { name: "Pro Tier" } });
  if (!planPro) {
    planPro = await prisma.saaSPlan.create({
      data: {
        name: "Pro Tier",
        maxProperties: 10,
        maxUnits: 100,
        priceMonthly: 299000,
        priceYearly: 2990000,
        features: ["10 Properties", "Up to 100 Units", "AI Financial Insights", "Housekeeping Module"],
      },
    });
    console.log(`✅ Created SaaS Plan: ${planPro.name}`);
  } else {
    console.log(`ℹ️ Existing SaaS Plan found: ${planPro.name}`);
  }

  // 2. Owner Subscription
  const now = new Date();
  let subscription = await prisma.ownerSubscription.findFirst({
    where: { ownerId: owner.id },
  });

  if (!subscription) {
    subscription = await prisma.ownerSubscription.create({
      data: {
        ownerId: owner.id,
        planId: planPro.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear() + 1, now.getMonth(), 1),
        autoRenew: true,
      },
    });
    console.log(`✅ Created Owner Subscription for ${owner.fullName}`);
  } else {
    console.log(`ℹ️ Existing Owner Subscription found for ${owner.fullName}`);
  }

  // 3. SaaS Invoice
  const invNumber = `SAAS/INV/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/0001`;
  let saasInvoice = await prisma.saaSInvoice.findUnique({
    where: { invoiceNumber: invNumber },
  });

  if (!saasInvoice) {
    saasInvoice = await prisma.saaSInvoice.create({
      data: {
        subscriptionId: subscription.id,
        invoiceNumber: invNumber,
        amount: 299000,
        status: InvoiceStatus.PAID,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 1),
        paidAt: new Date(now.getFullYear(), now.getMonth(), 2),
        paymentProof: "https://xyzstorage.supabase.co/storage/v1/object/public/saas/proof_001.jpg",
      },
    });
    console.log(`✅ Created SaaS Invoice [PAID]: ${saasInvoice.invoiceNumber}`);
  } else {
    console.log(`ℹ️ Existing SaaS Invoice found: ${saasInvoice.invoiceNumber}`);
  }

  return { planBasic, planPro, subscription, saasInvoice };
}
