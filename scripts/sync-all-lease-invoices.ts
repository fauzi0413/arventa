import "dotenv/config";
import { prisma } from "../src/lib/prisma";

export async function generateInvoicesForLease(lease: {
  id: string;
  startDate: Date;
  endDate: Date;
  rentPrice: any;
  securityDeposit?: any;
}) {
  const startDate = new Date(lease.startDate);
  const endDate = new Date(lease.endDate);
  const rentPrice = Number(lease.rentPrice || 0);
  const deposit = Number(lease.securityDeposit || 0);

  const createdInvoices = [];
  let currentCycle = new Date(startDate);
  let monthIndex = 0;

  while (currentCycle < endDate) {
    monthIndex++;
    
    // Calculated due date for this cycle: cycleDate + 20 days (H+21 rule)
    const dueDate = new Date(currentCycle);
    dueDate.setDate(dueDate.getDate() + 20);
    dueDate.setHours(23, 59, 59, 999);

    const startOfDueDay = new Date(dueDate);
    startOfDueDay.setHours(0, 0, 0, 0);
    const endOfDueDay = new Date(dueDate);
    endOfDueDay.setHours(23, 59, 59, 999);

    // Check if invoice already exists around this due date
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        leaseId: lease.id,
        dueDate: {
          gte: startOfDueDay,
          lte: endOfDueDay,
        },
      },
    });

    if (!existingInvoice) {
      const year = currentCycle.getFullYear();
      const monthStr = String(currentCycle.getMonth() + 1).padStart(2, "0");
      const randStr = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV/${year}/${monthStr}/${randStr}`;

      // Month 1 includes deposit if available, subsequent months are rent price
      const totalAmount = monthIndex === 1 ? rentPrice + deposit : rentPrice;

      const newInv = await prisma.invoice.create({
        data: {
          invoiceNumber,
          leaseId: lease.id,
          amount: rentPrice,
          utilityAmount: 0,
          penaltyAmount: 0,
          totalAmount,
          dueDate,
          status: "PENDING",
        },
      });

      createdInvoices.push(newInv);
    }

    // Move to next month cycle
    const nextMonth = new Date(currentCycle);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    currentCycle = nextMonth;
  }

  return createdInvoices;
}

async function main() {
  console.log("=== GENERATING FULL CONTRACT INVOICES FOR ALL ACTIVE LEASES ===");

  const activeLeases = await prisma.lease.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      tenant: true,
      unit: { include: { property: true } },
      invoices: true,
    },
  });

  for (const lease of activeLeases) {
    console.log(`\nProcessing Lease ID: ${lease.id} (${lease.tenant.fullName} - ${lease.unit.property.name})`);
    console.log(`  Period: ${lease.startDate.toISOString().slice(0, 10)} to ${lease.endDate.toISOString().slice(0, 10)}`);
    console.log(`  Existing invoices count: ${lease.invoices.length}`);

    const created = await generateInvoicesForLease(lease);
    console.log(`  Newly generated invoices count: ${created.length}`);
    for (const inv of created) {
      console.log(`    - Created ${inv.invoiceNumber} | Due: ${inv.dueDate.toISOString().slice(0, 10)} | Amount: Rp ${Number(inv.totalAmount).toLocaleString('id-ID')}`);
    }
  }

  console.log("\n=== FINISHED SYNCING ALL LEASE INVOICES ===");
}

main()
  .catch((e) => console.error(e))
  .finally(() => { prisma.$disconnect(); });
