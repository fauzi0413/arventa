import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🛠️ Running Database Due Date Sync Script...");

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch all active leases with their invoices, tenant, and unit
  const leases = await prisma.lease.findMany({
    include: {
      tenant: { include: { user: true } },
      unit: { include: { property: true } },
      invoices: { orderBy: { createdAt: "asc" } },
    },
  });

  console.log(`Found ${leases.length} leases in database.`);

  for (const lease of leases) {
    const tenantName = lease.tenant?.fullName || lease.tenant?.user?.fullName || "Penyewa";
    const unitName = lease.unit ? `${lease.unit.property.name} - ${lease.unit.unitNumber}` : lease.id;
    const startDate = new Date(lease.startDate || "2026-05-31");

    console.log(`\n----------------------------------------`);
    console.log(`Lease: ${unitName} | Tenant: ${tenantName}`);
    console.log(`Start Date: ${startDate.toLocaleDateString("id-ID")}`);
    console.log(`Total Invoices in DB: ${lease.invoices.length}`);

    // Standard due day 21 of each month
    const dueDay = 21;

    // Determine sequence of target months from startDate
    const months: { year: number; month: number; targetDueDate: Date }[] = [];
    let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (cursor <= currentMonthStart || months.length < lease.invoices.length) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();

      const maxDaysInMonth = new Date(year, month + 1, 0).getDate();
      const targetDay = Math.min(dueDay, maxDaysInMonth);
      const targetDueDate = new Date(year, month, targetDay, 12, 0, 0);

      months.push({ year, month, targetDueDate });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const invoices = lease.invoices;
    const countToUpdate = Math.min(invoices.length, months.length);

    for (let i = 0; i < countToUpdate; i++) {
      const inv = invoices[i];
      const targetMonth = months[i];
      const targetDueDate = targetMonth.targetDueDate;

      const isCurrentMonth =
        targetDueDate.getFullYear() === now.getFullYear() &&
        targetDueDate.getMonth() === now.getMonth();

      const isPastMonth = targetDueDate < currentMonthStart;

      // Use valid Prisma InvoiceStatus: PAID, PENDING, OVERDUE
      const newStatus = isPastMonth
        ? "PAID"
        : inv.status === "PAID"
        ? "PAID"
        : targetDueDate < now
        ? "OVERDUE"
        : "PENDING";

      const newPaidAt = newStatus === "PAID"
        ? (inv.paidAt || new Date(targetMonth.year, targetMonth.month, 5, 10, 0, 0))
        : null;

      const invNumberYear = targetMonth.year;
      const invNumberMonth = String(targetMonth.month + 1).padStart(2, "0");
      const invNumberSeq = String(i + 1).padStart(4, "0");
      const newInvoiceNumber = `INV/${invNumberYear}/${invNumberMonth}/${invNumberSeq}`;

      console.log(
        `  -> Invoice #${inv.invoiceNumber} -> Updated: DueDate: ${targetDueDate.toLocaleDateString("id-ID")} | Status: ${newStatus} | InvNo: ${newInvoiceNumber}`
      );

      try {
        await prisma.invoice.update({
          where: { id: inv.id },
          data: {
            dueDate: targetDueDate,
            status: newStatus as any,
            paidAt: newPaidAt,
            invoiceNumber: newInvoiceNumber,
            totalAmount: inv.totalAmount || lease.rentPrice,
            amount: inv.amount || lease.rentPrice,
          },
        });
      } catch (err: any) {
        // If unique invoiceNumber fails, update without changing invoiceNumber
        await prisma.invoice.update({
          where: { id: inv.id },
          data: {
            dueDate: targetDueDate,
            status: newStatus as any,
            paidAt: newPaidAt,
            totalAmount: inv.totalAmount || lease.rentPrice,
            amount: inv.amount || lease.rentPrice,
          },
        });
      }
    }
  }

  console.log("\n✅ Database Invoice Due Dates and Statuses successfully synchronized!");
}

main()
  .catch((e) => console.error("❌ Sync script error:", e))
  .finally(() => prisma.$disconnect());
