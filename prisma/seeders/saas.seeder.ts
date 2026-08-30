import { prisma } from "../../src/lib/prisma";
import { User, SubscriptionStatus, InvoiceStatus } from "../../generated/prisma/client";

/**
 * Seed SaaS Plans, Owner Subscriptions, and SaaS Invoices (Platform Admin Billing).
 */
export async function seedSaaS(owner: User) {
  console.log("\n💳 Seeding SaaS Plans, Features & Subscriptions (Idempotent)...");

  // 1. Master System Features (SaaSFeature)
  const masterFeaturesData = [
    { code: "PROP_MGMT", name: "Manajemen Properti & Inventory", category: "OPERATIONAL", description: "Kelola data properti, bangunan, dan fasilitas." },
    { code: "TENANT_MGMT", name: "Manajemen Penyewa & Kontrak", category: "OPERATIONAL", description: "Kelola profil penghuni, sewa, dan riwayat." },
    { code: "HOUSEKEEPING_MODULE", name: "Modul Tim Operational Housekeeping", category: "OPERATIONAL", description: "Kelola penugasan staf kebersihan dan status kamar." },
    { code: "FAST_CHECKIN", name: "Fast Check-In & WA Direct Chat", category: "OPERATIONAL", description: "Check-in cepat di lapangan dan pesan WA langsung." },
    { code: "WA_REMINDER", name: "WhatsApp Automatic Payment Reminder", category: "FINANCIAL", description: "Pengingat otomatis jatuh tempo tagihan via WA." },
    { code: "FINANCIAL_ANALYTICS", name: "Analitik & Insights Keuangan SaaS", category: "FINANCIAL", description: "Laporan pemasukan, pengeluaran, dan proyeksi." },
    { code: "OCR_KTP", name: "Auto-scan KTP OCR Tenant", category: "SYSTEM", description: "Ekstraksi data KTP otomatis saat pendaftaran penyewa." },
    { code: "CUSTOM_DOMAIN", name: "Custom Domain & Branding Properti", category: "SYSTEM", description: "Gunakan domain sendiri untuk portal penyewa." },
  ];

  const createdFeatures: Record<string, any> = {};

  for (const fData of masterFeaturesData) {
    let f = await prisma.saaSFeature.findUnique({ where: { code: fData.code } });
    if (!f) {
      f = await prisma.saaSFeature.create({ data: fData });
      console.log(`✅ Created Master Feature: ${f.name} (${f.code})`);
    } else {
      console.log(`ℹ️ Existing Master Feature: ${f.name}`);
    }
    createdFeatures[f.code] = f;
  }

  // 2. SaaS Plans
  let planBasic = await prisma.saaSPlan.findUnique({ where: { name: "Basic Tier" } });
  if (!planBasic) {
    planBasic = await prisma.saaSPlan.create({
      data: {
        name: "Basic Tier",
        maxProperties: 1,
        maxUnits: 15,
        maxHousekeeping: 3,
        priceMonthly: 99000,
        priceYearly: 990000,
        features: ["1 Properti", "Hingga 15 Kamar", "3 Akun Housekeeping", "WA Reminders"],
      },
    });
    console.log(`✅ Created SaaS Plan: ${planBasic.name}`);
  } else {
    // Update maxHousekeeping if missing
    planBasic = await prisma.saaSPlan.update({
      where: { id: planBasic.id },
      data: { maxUnits: 15, maxHousekeeping: 3 },
    });
    console.log(`ℹ️ Updated SaaS Plan: ${planBasic.name}`);
  }

  let planPro = await prisma.saaSPlan.findUnique({ where: { name: "Pro Tier" } });
  if (!planPro) {
    planPro = await prisma.saaSPlan.create({
      data: {
        name: "Pro Tier",
        maxProperties: 10,
        maxUnits: 100,
        maxHousekeeping: 15,
        priceMonthly: 299000,
        priceYearly: 2990000,
        features: ["10 Properti", "Hingga 100 Kamar", "15 Akun Housekeeping", "Analitik Keuangan", "Modul Housekeeping"],
      },
    });
    console.log(`✅ Created SaaS Plan: ${planPro.name}`);
  } else {
    planPro = await prisma.saaSPlan.update({
      where: { id: planPro.id },
      data: { maxProperties: 10, maxUnits: 100, maxHousekeeping: 15 },
    });
    console.log(`ℹ️ Updated SaaS Plan: ${planPro.name}`);
  }

  // Map features to Basic Plan
  const basicCodes = ["PROP_MGMT", "TENANT_MGMT", "FAST_CHECKIN", "WA_REMINDER"];
  for (const code of basicCodes) {
    if (createdFeatures[code]) {
      const existingPF = await prisma.saaSPlanFeature.findUnique({
        where: { planId_featureId: { planId: planBasic.id, featureId: createdFeatures[code].id } },
      });
      if (!existingPF) {
        await prisma.saaSPlanFeature.create({
          data: { planId: planBasic.id, featureId: createdFeatures[code].id },
        });
      }
    }
  }

  // Map features to Pro Plan
  const proCodes = ["PROP_MGMT", "TENANT_MGMT", "HOUSEKEEPING_MODULE", "FAST_CHECKIN", "WA_REMINDER", "FINANCIAL_ANALYTICS", "OCR_KTP"];
  for (const code of proCodes) {
    if (createdFeatures[code]) {
      const existingPF = await prisma.saaSPlanFeature.findUnique({
        where: { planId_featureId: { planId: planPro.id, featureId: createdFeatures[code].id } },
      });
      if (!existingPF) {
        await prisma.saaSPlanFeature.create({
          data: { planId: planPro.id, featureId: createdFeatures[code].id },
        });
      }
    }
  }

  // 3. SaaS Add-Ons Catalog (SaaSAddOn)
  const defaultAddOns = [
    {
      name: "+10 Extra Unit Kamar",
      category: "UNIT",
      unitQuota: 10,
      priceMonthly: 49000,
      priceYearly: 490000,
      description: "Tambahkan kuota 10 kamar kos/apartemen ekstra untuk ekspansi.",
      status: "ACTIVE",
    },
    {
      name: "+1 Extra Properti",
      category: "PROPERTY",
      unitQuota: 1,
      priceMonthly: 99000,
      priceYearly: 990000,
      description: "Tambahkan kuota 1 lokasi properti baru.",
      status: "ACTIVE",
    },
    {
      name: "+5 Akun Housekeeping",
      category: "HOUSEKEEPING",
      unitQuota: 5,
      priceMonthly: 35000,
      priceYearly: 350000,
      description: "Tambahkan kuota 5 akun staf operasional kebersihan lapangan.",
      status: "ACTIVE",
    },
    {
      name: "Fitur Add-On OCR KTP Auto-scan",
      category: "FEATURE",
      unitQuota: 0,
      priceMonthly: 29000,
      priceYearly: 290000,
      description: "Buka fitur auto-scan KTP penyewa otomatis tanpa batas.",
      status: "ACTIVE",
    },
  ];

  for (const addOn of defaultAddOns) {
    const existing = await prisma.saaSAddOn.findFirst({
      where: { name: addOn.name },
    });
    if (!existing) {
      await prisma.saaSAddOn.create({ data: addOn });
      console.log(`✅ Created SaaS Add-On: ${addOn.name}`);
    } else {
      console.log(`ℹ️ Existing SaaS Add-On found: ${addOn.name}`);
    }
  }

  // 4. Owner Subscription
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

  // 5. SaaS Invoice
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

  // 6. SaaS Payment Methods
  const defaultPaymentMethods = [
    {
      bankName: "Bank Central Asia (BCA)",
      accountNumber: "8421130965",
      accountHolder: "Fauzi Aditya Pratama",
      badgeColor: "bg-blue-600",
      isEnabled: true,
      notes: "Transfer via ATM, M-BCA, atau KlikBCA. Sertakan kode ref invoice pada berita transfer.",
    },
  ];

  for (const pm of defaultPaymentMethods) {
    const existing = await prisma.saaSPaymentMethod.findFirst({
      where: { accountNumber: pm.accountNumber },
    });
    if (!existing) {
      await prisma.saaSPaymentMethod.create({ data: pm });
      console.log(`✅ Created SaaS Payment Method: ${pm.bankName} (${pm.accountNumber})`);
    } else {
      console.log(`ℹ️ Existing SaaS Payment Method found: ${pm.bankName}`);
    }
  }

  return { planBasic, planPro, subscription, saasInvoice };
}
