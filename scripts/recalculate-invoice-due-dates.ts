import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== START RECALCULATING INVOICE DUE DATES (H+21 RULE) ===");

  const invoices = await prisma.invoice.findMany({
    include: {
      lease: true,
    },
  });

  const now = new Date(); // Current date

  for (const inv of invoices) {
    const oldDueDate = new Date(inv.dueDate);
    
    // Determine cycle date from oldDueDate
    // Old due dates were set around Aug 30 - Sep 1 for the September cycle (Sep 1)
    let cycleYear = oldDueDate.getFullYear();
    let cycleMonth = oldDueDate.getMonth();
    
    // If old due date was late in the month (e.g. Aug 30/31), cycle starts on Sept 1 (month 8, 1st)
    if (oldDueDate.getDate() >= 28) {
      cycleMonth += 1;
    }
    
    // Target cycle date (e.g., 2026-09-01)
    const cycleDate = new Date(cycleYear, cycleMonth, 1);
    
    // New due date = H+21 (cycleDate + 20 days -> e.g. 2026-09-21)
    const newDueDate = new Date(cycleDate);
    newDueDate.setDate(newDueDate.getDate() + 20); // Sept 21
    newDueDate.setHours(23, 59, 59, 999);

    let newStatus = inv.status;
    let newPenalty = Number(inv.penaltyAmount || 0);

    // If invoice is not paid yet
    if (inv.status !== "PAID" && inv.status !== "CANCELLED") {
      if (now <= newDueDate) {
        // Not past due yet! Reset status to PENDING & clear penalty
        newStatus = "PENDING" as any;
        newPenalty = 0;
      } else {
        // Past due date
        newStatus = "OVERDUE" as any;
      }
    }

    const newTotalAmount = Number(inv.amount) + Number(inv.utilityAmount) + newPenalty;

    console.log(`Invoice #${inv.invoiceNumber}:`);
    console.log(`  Old DueDate: ${oldDueDate.toISOString().slice(0, 10)} | Old Status: ${inv.status} | Old Total: ${inv.totalAmount}`);
    console.log(`  New DueDate: ${newDueDate.toISOString().slice(0, 10)} | New Status: ${newStatus} | New Total: ${newTotalAmount}`);

    await prisma.invoice.update({
      where: { id: inv.id },
      data: {
        dueDate: newDueDate,
        status: newStatus,
        penaltyAmount: newPenalty,
        totalAmount: newTotalAmount,
      },
    });
  }

  console.log("=== SUCCESSFULLY RECALCULATED ALL INVOICES ===");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
