import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const lease = await prisma.lease.findFirst({
    where: {
      tenant: {
        fullName: {
          contains: 'Rizky Pratama',
          mode: 'insensitive'
        }
      }
    },
    include: {
      unit: true,
      invoices: true
    }
  });

  console.log('--- RIZKY PRATAMA LEASE & INVOICES ---');
  console.log({
    leaseId: lease?.id,
    rentPrice: lease?.rentPrice,
    unitRentPrice: lease?.unit?.rentPrice,
    invoices: lease?.invoices.map(i => ({
      invoiceNumber: i.invoiceNumber,
      amount: Number(i.amount),
      utilityAmount: Number(i.utilityAmount),
      penaltyAmount: Number(i.penaltyAmount),
      totalAmount: Number(i.totalAmount),
    }))
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
