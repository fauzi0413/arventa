import { prisma } from "../../src/lib/prisma";
import {
  Unit,
  TenantProfile,
  RentalPeriodType,
  LeaseStatus,
  InvoiceStatus,
} from "../../generated/prisma/client";

interface SeedLeasesProps {
  unitKos101: Unit;
  unitApt12B01: Unit;
  tenantSitiProfile: TenantProfile;
  tenantRizkyProfile: TenantProfile;
}

/**
 * Seed active leases and invoices (PAID, PENDING, OVERDUE).
 * Idempotent: Checks active lease by unit & tenant, and invoice by invoiceNumber before creation.
 */
export async function seedLeasesAndInvoices({
  unitKos101,
  unitApt12B01,
  tenantSitiProfile,
  tenantRizkyProfile,
}: SeedLeasesProps) {
  console.log("\n📜 Seeding Leases & Invoices (Idempotent)...");

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);

  // Lease 1: Kos 101 -> Tenant Siti
  let lease1 = await prisma.lease.findFirst({
    where: {
      unitId: unitKos101.id,
      tenantId: tenantSitiProfile.id,
      status: LeaseStatus.ACTIVE,
    },
  });
  if (!lease1) {
    lease1 = await prisma.lease.create({
      data: {
        unitId: unitKos101.id,
        tenantId: tenantSitiProfile.id,
        rentalPeriod: RentalPeriodType.MONTHLY,
        startDate: startOfYear,
        endDate: endOfYear,
        rentPrice: 1500000,
        securityDeposit: 500000,
        status: LeaseStatus.ACTIVE,
        contractUrl:
          "https://xyzstorage.supabase.co/storage/v1/object/public/contracts/lease_kos101.pdf",
      },
    });
    console.log(`✅ Created Active Lease for ${unitKos101.unitNumber}`);
  } else {
    console.log(`ℹ️ Existing Active Lease found for ${unitKos101.unitNumber}`);
  }

  // Lease 2: Apt 12B-01 -> Tenant Rizky
  let lease2 = await prisma.lease.findFirst({
    where: {
      unitId: unitApt12B01.id,
      tenantId: tenantRizkyProfile.id,
      status: LeaseStatus.ACTIVE,
    },
  });
  if (!lease2) {
    lease2 = await prisma.lease.create({
      data: {
        unitId: unitApt12B01.id,
        tenantId: tenantRizkyProfile.id,
        rentalPeriod: RentalPeriodType.MONTHLY,
        startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 4, 1),
        rentPrice: 4500000,
        securityDeposit: 1000000,
        status: LeaseStatus.ACTIVE,
        contractUrl:
          "https://xyzstorage.supabase.co/storage/v1/object/public/contracts/lease_apt12b01.pdf",
      },
    });
    console.log(`✅ Created Active Lease for ${unitApt12B01.unitNumber}`);
  } else {
    console.log(`ℹ️ Existing Active Lease found for ${unitApt12B01.unitNumber}`);
  }

  // Invoice 1: PAID (Lunas bulan ini)
  const invNumber1 = `INV/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/0001`;
  let paidInvoice = await prisma.invoice.findUnique({
    where: { invoiceNumber: invNumber1 },
  });
  if (!paidInvoice) {
    paidInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invNumber1,
        leaseId: lease1.id,
        amount: 1500000,
        utilityAmount: 50000,
        penaltyAmount: 0,
        totalAmount: 1550000,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 1),
        paidAt: new Date(now.getFullYear(), now.getMonth(), 2),
        status: InvoiceStatus.PAID,
        paymentReceipt:
          "https://xyzstorage.supabase.co/storage/v1/object/public/receipts/inv_0001_paid.jpg",
      },
    });
    console.log(`✅ Created Invoice [PAID]: ${paidInvoice.invoiceNumber}`);
  } else {
    console.log(`ℹ️ Existing Invoice found: ${paidInvoice.invoiceNumber}`);
  }

  // Invoice 2: PENDING (Jatuh tempo H-3)
  const invNumber2 = `INV/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/0002`;
  let pendingInvoice = await prisma.invoice.findUnique({
    where: { invoiceNumber: invNumber2 },
  });
  if (!pendingInvoice) {
    const dueDatePending = new Date();
    dueDatePending.setDate(now.getDate() + 3);

    pendingInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invNumber2,
        leaseId: lease2.id,
        amount: 4500000,
        utilityAmount: 150000,
        penaltyAmount: 0,
        totalAmount: 4650000,
        dueDate: dueDatePending,
        status: InvoiceStatus.PENDING,
      },
    });
    console.log(`✅ Created Invoice [PENDING]: ${pendingInvoice.invoiceNumber}`);
  } else {
    console.log(`ℹ️ Existing Invoice found: ${pendingInvoice.invoiceNumber}`);
  }

  // Invoice 3: OVERDUE (Menunggak 5 hari)
  const invNumber3 = `INV/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/0003`;
  let overdueInvoice = await prisma.invoice.findUnique({
    where: { invoiceNumber: invNumber3 },
  });
  if (!overdueInvoice) {
    const dueDateOverdue = new Date();
    dueDateOverdue.setDate(now.getDate() - 5);

    overdueInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invNumber3,
        leaseId: lease1.id,
        amount: 1500000,
        utilityAmount: 0,
        penaltyAmount: 50000,
        totalAmount: 1550000,
        dueDate: dueDateOverdue,
        status: InvoiceStatus.OVERDUE,
      },
    });
    console.log(`✅ Created Invoice [OVERDUE]: ${overdueInvoice.invoiceNumber}`);
  } else {
    console.log(`ℹ️ Existing Invoice found: ${overdueInvoice.invoiceNumber}`);
  }

  return {
    lease1,
    lease2,
    paidInvoice,
    pendingInvoice,
    overdueInvoice,
  };
}
