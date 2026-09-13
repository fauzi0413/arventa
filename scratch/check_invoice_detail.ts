import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const invoices = await prisma.invoice.findMany({
    include: {
      lease: {
        include: {
          unit: true,
          tenant: true
        }
      }
    }
  });

  console.log('--- ALL INVOICES IN DB ---');
  for (const inv of invoices) {
    console.log({
      invoiceNumber: inv.invoiceNumber,
      amount: Number(inv.amount),
      utilityAmount: Number(inv.utilityAmount),
      penaltyAmount: Number(inv.penaltyAmount),
      totalAmount: Number(inv.totalAmount),
      dueDate: inv.dueDate,
      status: inv.status,
      tenant: inv.lease?.tenant?.fullName,
      unit: inv.lease?.unit?.unitNumber
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
