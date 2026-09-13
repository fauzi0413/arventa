import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const inv = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: 'INV/2026/05/0001'
    },
    include: {
      lease: {
        include: {
          unit: true,
          tenant: true
        }
      }
    }
  });

  console.log('--- EXACT INVOICE RECORD ---');
  console.log(JSON.stringify(inv, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
